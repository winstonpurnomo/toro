import { Box, Text } from 'ink';

type Props = {
  name: string | undefined;
};

export default function App({ name = 'Stranger' }: Props) {
  return (
    <Box flexDirection="column" margin={1}>
      <Text>
        Hello, <Text color="blue">{name}</Text>
      </Text>
    </Box>
  );
}
