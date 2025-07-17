interface APIResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export function successResponse<T>(
  message: string = 'Success',
  data?: T
): APIResponse<T> {
  return { success: true, message, data };
}

export function errorResponse<T>(message: string, data?: T): APIResponse<T> {
  return { success: false, message, data };
}
