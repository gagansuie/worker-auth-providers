import jwt from '@tsndr/cloudflare-worker-jwt';
import { ProviderVerifyOtpError } from '../../utils/errors';

function generateJWT({ secret, phone, claims }) {
	const customClaims = claims || {
		id: phone
	};
	return jwt.sign({ exp: '24h', ...customClaims}, secret, { algorithm: 'HS256' });
}

export default async function verify({ options }) {
	const { kvProvider, phone, otp, secret, claims } = options;

	const storedOtp = await kvProvider.get(phone);

	if (!storedOtp || Number(otp) !== Number(storedOtp)) {
		throw new ProviderVerifyOtpError({
			message: 'OTP did not match!'
		});
	}

	const token = secret ? generateJWT({
		secret,
		phone,
		claims
	}) : null;

	await kvProvider.delete(phone);

	return token ? {
		id: phone,
		token
	} : {
		id: phone
	};
}