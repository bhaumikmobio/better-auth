type RequiredEnvOptions = {
  trim?: boolean;
  errorMessage?: string;
};

export const getRequiredEnv = (
  name: string,
  options?: RequiredEnvOptions,
): string => {
  const rawValue = process.env[name];
  const value = options?.trim ? rawValue?.trim() : rawValue;

  if (!value) {
    throw new Error(options?.errorMessage ?? `${name} is required`);
  }

  return value;
};
