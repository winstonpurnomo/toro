import { Box } from 'ink';
import TextInput from 'ink-text-input';
import { useState } from 'react';
import { useNavigate } from 'toro-router';

export default function Home() {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  return (
    <Box>
      <TextInput
        onChange={setValue}
        onSubmit={() => navigate({ to: '/h/about', params: { name: 'Bob' } })}
        value={value}
      />
    </Box>
  );
}
