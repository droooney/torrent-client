import KeeneticCommand from 'router-client/providers/KeeneticCommand';
import { z } from 'zod';

export default new KeeneticCommand(
  'show ip hotspot multicast',
  z.object({
    host: z.array(
      z.object({
        hostname: z.string(),
        name: z.string(),
        ip: z.string(),
        mac: z.string(),
        active: z.boolean(),
      }),
    ),
  }),
);
