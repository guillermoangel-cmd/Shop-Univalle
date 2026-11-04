import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: '../../.env' });

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
			enum: ['ESTUDIANTE', 'DOCENTE', 'ADMINISTRATIVO'],
		},
		authorized: { type: Boolean, required: true, default: true },
	},
	{ collection: 'correos_institucionales', timestamps: true },
);

const AuthorizedEmail = mongoose.model(
	'AuthorizedEmailSeed',
	authorizedEmailSchema,
);

const demoAccounts = [
	{
		email: 'estudiante.demo@correounivalle.edu.co',
		nombre: 'Estudiante',
		apellido: 'Demo',
		rol: 'ESTUDIANTE',
		authorized: true,
	},
	{
		email: 'docente.demo@correounivalle.edu.co',
		nombre: 'Docente',
		apellido: 'Demo',
		rol: 'DOCENTE',
		authorized: true,
	},
	{
		email: 'administrativo.demo@correounivalle.edu.co',
		nombre: 'Administrativo',
		apellido: 'Demo',
		rol: 'ADMINISTRATIVO',
		authorized: true,
	},
];

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