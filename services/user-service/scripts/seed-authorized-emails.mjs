import { readFile } from 'node:fs/promises';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: '../../.env' });

const seedFile = new URL(
	'../seeds/data/correos-institucionales.seed.json',
	import.meta.url,
);
// The administrator demo is for testing catalog management and stays unauthorized by default.
const demoAccounts = JSON.parse(await readFile(seedFile, 'utf8'));

const mongoUri =
	process.env.MONGODB_URI ??
	'mongodb://127.0.0.1:27017/univalle_users';

const authorizedEmailSchema = new mongoose.Schema(
	{
		email: { type: String, required: true, unique: true, lowercase: true, trim: true },
		nombre: { type: String, required: true, trim: true },
		apellido: { type: String, required: true, trim: true },
		rol: {
			type: String,
			required: true,
			enum: ['ESTUDIANTE', 'DOCENTE', 'ADMINISTRATIVO', 'ADMINISTRADOR'],
		},
		authorized: { type: Boolean, required: true, default: true },
	},
	{ collection: 'correos_institucionales', timestamps: true },
);

const AuthorizedEmail = mongoose.model(
	'AuthorizedEmailSeed',
	authorizedEmailSchema,
);

try {
	await mongoose.connect(mongoUri);
	for (const account of demoAccounts) {
		await AuthorizedEmail.updateOne(
			{ email: account.email },
			{ $setOnInsert: account },
			{ upsert: true },
		);
	}
	console.log(`Se verificaron ${demoAccounts.length} correos de demostración.`);
} finally {
	await mongoose.disconnect();
}