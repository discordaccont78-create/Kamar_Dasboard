
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSegments } from '../lib/store/segments';
import { useWebSocket } from './useWebSocket';
import { Segment, CMD } from '../types/index';

// Hook to read current state of a device
export function useDeviceState(segmentId: string) {
  const { segments } = useSegments();
  const initialSegment = segments.find(s => s.num_of_node === segmentId);

  return useQuery({
    queryKey: ['device', segmentId],
    queryFn: () => initialSegment, // Only used if no data in cache
    initialData: initialSegment,
    enabled: !!segmentId,
  });
}

// Hook to control a device with Optimistic UI Updates
export function useDeviceControl() {
  const { sendCommand } = useWebSocket();
  const queryClient = useQueryClient();

  return useMutation({
    // 1. Mutate: This runs immediately when you call controlDevice
    onMutate: async (payload: { cmd: number, gpio: number, value: number, nodeId: string }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['device', payload.nodeId] });

      // Snapshot the previous value
      const previousDevice = queryClient.getQueryData<Segment>(['device', payload.nodeId]);
      
      // Snapshot Zustand state
      const previousSegmentState = useSegments.getState().segments.find(s => s.num_of_node === payload.nodeId);

      // Prepare Updates
      const updates: Partial<Segment> = {};
      const currentIsOn = previousDevice?.is_led_on || previousSegmentState?.is_led_on || 'off';

      switch (payload.cmd) {
            case CMD.LED_ON: 
                updates.is_led_on = 'on'; 
                break;
            case CMD.LED_OFF: 
                updates.is_led_on = 'off'; 
                break;
            case CMD.LED_TOGGLE:
                updates.is_led_on = currentIsOn === 'on' ? 'off' : 'on';
                break;
            case CMD.LED_PWM: 
                updates.val_of_slide = payload.value; 
                break;
      }

      // Optimistically update React Query Cache
      queryClient.setQueryData(['device', payload.nodeId], (old: Segment | undefined) => {
        if (!old) return old;
        return { ...old, ...updates };
      });

      // Optimistically update Zustand Store (Critical for SideMenu status table sync)
      useSegments.getState().updateSegment(payload.nodeId, updates);

      // Return a context object with the snapshotted value
      return { previousDevice, previousSegmentState };
    },

    // 2. The actual network request
    mutationFn: async (payload: { cmd: number, gpio: number, value: number, nodeId: string }) => {
      const success = sendCommand(payload.cmd, payload.gpio, payload.value);
      if (!success) throw new Error("Failed to send command (Device Offline)");
      return payload;
    },

    // 3. If the network request fails, roll back to the saved value
    onError: (err, newTodo, context: any) => {
      if (context?.previousDevice) {
        queryClient.setQueryData(['device', newTodo.nodeId], context.previousDevice);
      }
      if (context?.previousSegmentState) {
        useSegments.getState().updateSegment(newTodo.nodeId, context.previousSegmentState);
      }
    },

    // 4. Always refetch after error or success to ensure sync
    onSettled: (data, error, variables) => {
      // Optional: queryClient.invalidateQueries({ queryKey: ['device', variables.nodeId] });
    },
  });
}
