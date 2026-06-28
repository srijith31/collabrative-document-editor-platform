import bcrypt from 'bcryptjs';

const run = async () => {
  const hash = '$2b$10$lSUXhXWZ5t8cZAj9urdkveWQLZ4tNOUvuTTyyp035E6L4gEeZjcmS';
  
  const tests = ['password123', 'password', 'undefined', ''];
  for (const t of tests) {
    const match = await bcrypt.compare(t, hash);
    console.log(`Comparing with "${t}": ${match}`);
  }
};

run();
