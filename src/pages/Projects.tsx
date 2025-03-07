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
import React, { useCallback, useEffect, useState } from "react";
import { getAllProjects } from "../services/http";

const Projects = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const projects = useStore((state) => state.projects);
  const [projectList, setProjectList] = useState<any[]>([]);

  // useEffect(() => {
  //   if (!isOpen) {
  //     getAllProjects().then((allProjects) => {
  //       if (allProjects?.projects && allProjects.projects.length) {
  //         setProjectList([...(allProjects.projects as [])]);
  //       }
  //     });
  //   }
  // }, [isOpen]);

  const handleClose = useCallback(() => {
    onClose();
    getAllProjects().then((allProjects) => {
      if (allProjects?.projects && allProjects.projects.length) {
        setProjectList([...(allProjects.projects as [])]);
      }
    });
  }, [onClose, projectList]);

  useEffect(() => {
    getAllProjects().then((allProjects) => {
      if (allProjects?.projects && allProjects.projects.length) {
        setProjectList([...(allProjects.projects as [])]);
      }
    });
  }, []);
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
            {projectList.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </Grid>
        )}
      </VStack>

      <CreateProjectModal isOpen={isOpen} onClose={handleClose} />
    </Container>
  );
};

export default Projects;
