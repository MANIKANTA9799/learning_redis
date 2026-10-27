import express from 'express';
import Redis from 'ioredis';

const app = express();

app.use(express.json());

const redis = new Redis(
    process.env.REDIS_URL || 'redis://localhost:6379'
);

function otpkey(num) {
    return `otp:${num}`;
}

function genotp() {
    return Math.floor(1000 + Math.random() * 9000);
}

app.post('/otp', async (req, res) => {
    const { num } = req.body;

    const key = otpkey(num);
    const otp = genotp();

    await redis.set(key, otp, 'EX', 5);

    res.json({
        message: 'otp sent',
        otp
    });
});

app.post('/otp/verify', async (req, res) => {
    const { num, otp } = req.body;

    const key = otpkey(num);

    const savedOtp = await redis.get(key);

    if (!savedOtp) {
        return res.status(400).json({
            message: 'OTP expired or not found'
        });
    }

    if (savedOtp !== String(otp)) {
        return res.status(400).json({
            message: 'Invalid OTP'
        });
    }

    await redis.del(key);

    res.json({
        message: 'OTP verified'
    });
});

app.get('/otp/ttl', async (req, res) => {
    const { num } = req.query;

    const key = otpkey(num);

    const ttl = await redis.ttl(key);

    res.json({
        ttl
    });
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});