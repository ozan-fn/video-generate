import dns from "node:dns/promises";
import mongoose from "mongoose";

dns.setServers(["1.1.1.1"]);

mongoose.connect(process.env.MONGODB_URI!);

export default mongoose;
