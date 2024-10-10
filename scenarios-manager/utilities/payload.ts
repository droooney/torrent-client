import { EditScenarioPayload, editScenarioPayloadSchema } from 'scenarios-manager/types/scenario';

export function getEditScenarioPayload(payload: unknown): EditScenarioPayload | null {
  const parsedPayload = editScenarioPayloadSchema.safeParse(payload);

  return parsedPayload.success ? parsedPayload.data : null;
}
