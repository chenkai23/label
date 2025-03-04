import { Box } from "@chakra-ui/react";
import Header from "../components/Header";
import React from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <Box minH="100vh">
      <Header />
      <Box pt="64px">{children}</Box>
    </Box>
  );
};

export default MainLayout;
