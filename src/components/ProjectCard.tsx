import {
  Box,
  VStack,
  Text,
  Badge,
  useColorMode,
  HStack,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { Project } from "../types/project";
import React from "react";

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  const { colorMode } = useColorMode();

  return (
    <Link to={`/projects/${project.id}`}>
      <Box
        p={4}
        borderRadius="lg"
        bg={colorMode === "dark" ? "gray.700" : "white"}
        boxShadow="sm"
        _hover={{
          transform: "translateY(-2px)",
          boxShadow: "md",
        }}
        transition="all 0.2s"
      >
        <VStack align="stretch" spacing={2}>
          <Text fontSize="lg" fontWeight="bold" noOfLines={1}>
            {project.name}
          </Text>
          <Text fontSize="sm" color="gray.500" noOfLines={2}>
            {project.description}
          </Text>
          <HStack>
            <Badge colorScheme="blue">{project.imageCount} 张图片</Badge>
            <Text fontSize="xs" color="gray.500">
              更新于 {new Date(project.updatedAt).toLocaleDateString()}
            </Text>
          </HStack>
        </VStack>
      </Box>
    </Link>
  );
};

export default ProjectCard;
