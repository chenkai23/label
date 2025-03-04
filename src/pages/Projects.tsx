import {
  Container,
  Grid,
  Button,
  VStack,
  useDisclosure,
  Text,
} from "@chakra-ui/react";
import { FiPlus } from "react-icons/fi";
import { useStore } from "../store";
import ProjectCard from "../components/ProjectCard";
import CreateProjectModal from "../components/CreateProjectModal";
import React from "react";

const Projects = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const projects = useStore((state) => state.projects);

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Button
          leftIcon={<FiPlus />}
          colorScheme="brand"
          alignSelf="flex-end"
          onClick={onOpen}
        >
          创建项目
        </Button>

        {projects.length === 0 ? (
          <Text textAlign="center" color="gray.500">
            暂无项目，点击上方按钮创建新项目
          </Text>
        ) : (
          <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </Grid>
        )}
      </VStack>

      <CreateProjectModal isOpen={isOpen} onClose={onClose} />
    </Container>
  );
};

export default Projects;
