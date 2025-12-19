
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

// Hook to control a device
export function useDeviceControl() {
  const { sendCommand } = useWebSocket();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { cmd: number, gpio: number, value: number, nodeId: string }) => {
      // Optimistic update logic could go here, but we'll wait for command sending
      const success = sendCommand(payload.cmd, payload.gpio, payload.value);
      if (!success) throw new Error("Failed to send command");
      return payload;
    },
    onSuccess: (variables) => {
      // Optimistically update the cache on successful send
      // In a real app, we might wait for ACK, but for responsiveness we update now
      queryClient.setQueryData(['device', variables.nodeId], (old: Segment | undefined) => {
        if (!old) return old;
        
        const updates: Partial<Segment> = {};
        
        switch (variables.cmd) {
            case CMD.LED_ON: updates.is_led_on = 'on'; break;
            case CMD.LED_OFF: updates.is_led_on = 'off'; break;
            case CMD.LED_PWM: updates.val_of_slide = variables.value; break;
            // Add other cases as needed
        }

        return { ...old, ...updates };
      });
    }
  });
}
