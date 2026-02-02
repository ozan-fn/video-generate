import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
    id: string;
    cookies: string;
    status: 'valid' | 'invalid' | 'pending';
    createdAt: Date;
    updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
    {
        id: {
            type: String,
            required: true,
            unique: true,
        },
        cookies: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['valid', 'invalid', 'pending'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    },
);

export const Session = mongoose.model<ISession>('Session', sessionSchema);
