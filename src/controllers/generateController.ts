import { Request, Response } from "express";
import { GenerateResponse } from "../models/generate";

export const getHealth = (req: Request, res: Response) => {
  res.json({ status: "ok" });
};

export const getInfo = (req: Request, res: Response) => {
  res.json({ message: "Video Generate API Server" });
};

export const generateVideo = (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    const files = req.files as Express.Multer.File[];

    // Validation
    if (!files || files.length !== 2) {
      return res.status(400).json({
        error: "Exactly 2 image files are required",
      });
    }

    if (!prompt) {
      return res.status(400).json({
        error: "Prompt is required",
      });
    }

    // Response
    const response: GenerateResponse = {
      message: "Generate request received",
      prompt,
      images: files.map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        path: file.path,
      })),
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
