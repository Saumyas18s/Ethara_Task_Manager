import { Response } from 'express';

export const sendResponse = (res: Response, status: number, data: any = null, message: string = '', success: boolean = true) => {
  return res.status(status).json({
    success,
    data,
    message,
  });
};

export const sendError = (res: Response, status: number, message: string) => {
  return sendResponse(res, status, null, message, false);
};
