import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/login", async (req: any, res: any) => {
    const { username, password } = req.body;

    const envUsername = process.env.USERNAME;
    const envPassword = process.env.PASSWORD;
    const jwtSecret = process.env.JWT_SECRET || "default_secret";
    console.log(envUsername, envPassword);
    if (!envUsername || !envPassword) {
        return res.status(500).json({ message: "Server configuration error" });
    }

    if (username !== envUsername) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    if (password !== envPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ username }, jwtSecret, { expiresIn: "24h" });

    res.json({ token });
});

export const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access token required" });
    }

    const jwtSecret = process.env.JWT_SECRET || "default_secret";

    try {
        const decoded = jwt.verify(token, jwtSecret);
        (req as any).user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid token" });
    }
};

export default router;
