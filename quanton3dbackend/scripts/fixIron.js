import mongoose from "mongoose";
import dotenv from "dotenv";
import Parametro from "../models/Parametro.js";

dotenv.config();

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);

  const r = await Parametro.updateMany(
    { resina: "FERRO" },
    { $set: { resina: "IRON" } }
  );

  console.log("Corrigidos:", r.modifiedCount);
  process.exit(0);
}

fix();