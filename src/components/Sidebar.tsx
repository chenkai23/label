import { Box, VStack, Icon, Tooltip, useColorMode } from "@chakra-ui/react";
import React from "react";
import { FiHome, FiFolder, FiSettings } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";

const SidebarItem = ({
  icon,
  label,
  to,
}: {
  icon: any;
  label: string;
  to: string;
}) => {
  const location = useLocation();
  const { colorMode } = useColorMode();
  const isActive = location.pathname === to;

  return (
    <Tooltip label={label} placement="right">
      <Box
        as={Link}
        to={to}
        p={3}
        borderRadius="md"
        bg={
          isActive
            ? colorMode === "dark"
              ? "brand.700"
              : "brand.100"
            : "transparent"
        }
        color={isActive ? "brand.500" : undefined}
        _hover={{
          bg: colorMode === "dark" ? "whiteAlpha.200" : "gray.100",
        }}
      >
        <Icon as={icon} boxSize={6} />
      </Box>
    </Tooltip>
  );
};

const Sidebar = () => {
  const { colorMode } = useColorMode();

  return (
    <Box
      as="nav"
      h="100vh"
      w="72px"
      bg={colorMode === "dark" ? "gray.900" : "white"}
      borderRight="1px"
      borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
      py={6}
    >
      <VStack spacing={4}>
        <SidebarItem icon={FiHome} label="首页" to="/" />
        <SidebarItem icon={FiFolder} label="项目" to="/projects" />
        <SidebarItem icon={FiSettings} label="设置" to="/settings" />
      </VStack>
    </Box>
  );
};

export default Sidebar;
