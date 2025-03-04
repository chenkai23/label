import {
  Box,
  Flex,
  IconButton,
  useColorMode,
  Text,
  HStack,
} from "@chakra-ui/react";
import React from "react";
import { FiSun, FiMoon } from "react-icons/fi";
import { Link } from "react-router-dom";

const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      height="64px"
      bg={colorMode === "dark" ? "gray.800" : "white"}
      borderBottom="1px"
      borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
      zIndex={100}
    >
      <Flex h="100%" px={4} align="center" justify="space-between">
        <HStack spacing={8}>
          <Link to="/">
            <Text fontSize="xl" fontWeight="bold">
              标注工具
            </Text>
          </Link>
          <Link to="/projects">
            <Text>项目列表</Text>
          </Link>
        </HStack>
        <IconButton
          aria-label="切换主题"
          icon={colorMode === "dark" ? <FiSun /> : <FiMoon />}
          onClick={toggleColorMode}
          variant="ghost"
        />
      </Flex>
    </Box>
  );
};

export default Header;
