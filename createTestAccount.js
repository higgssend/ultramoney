import { createClient } from '@insforge/sdk';

const insforgeUrl = 'https://9eq2fhs7.us-east.insforge.app';
const insforgeKey = 'ik_90dda71e4ee5c755d131e980c93f10b5';

const insforge = createClient(insforgeUrl, insforgeKey);

async function createTestAccount() {
    const { data, error } = await insforge.auth.signUp({
        email: 'test@ultramoney.com',
        password: 'Password123!',
    });
    
    if (error) {
        console.error('Error creating account:', error);
    } else {
        console.log('Account created:', data.user?.email);
    }
}

createTestAccount();
