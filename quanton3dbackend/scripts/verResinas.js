import mongoose from "mongoose";
import dotenv from "dotenv";
import Parametro from "../models/Parametro.js";

dotenv.config();

async function ver() {
  await mongoose.connect(process.env.MONGODB_URI);

  const resinas = await Parametro.distinct("resina");
  console.log(resinas.sort());

  process.exit(0);
}

ver();