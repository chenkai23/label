import {
  Container,
  VStack,
  Heading,
  Text,
  Button,
  useColorMode,
} from "@chakra-ui/react";
import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  const { colorMode } = useColorMode();

  return (
    <Container maxW="container.md" py={20}>
      <VStack spacing={8} textAlign="center">
        <Heading size="2xl">数据标注平台</Heading>
        <Text
          fontSize="xl"
          color={colorMode === "dark" ? "gray.400" : "gray.600"}
        >
          简单高效的图像标注工具，支持矩形框标注、标签管理等功能
        </Text>
        <Button as={Link} to="/projects" colorScheme="brand" size="lg">
          开始使用
        </Button>
      </VStack>
    </Container>
  );
};

export default Home;
