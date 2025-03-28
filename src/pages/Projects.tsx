import {
  Container,
  Grid,
  Button,
  VStack,
  useDisclosure,
  Text,
  Toast,
  useToast,
} from "@chakra-ui/react";
import { FiPlus } from "react-icons/fi";
import { useStore } from "../store";
import ProjectCard from "../components/ProjectCard";
import CreateProjectModal from "../components/CreateProjectModal";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { deleteProject, getAllProjects } from "../services/http";

const Projects = () => {
  const {
    isOpen: createIsOpen,
    onOpen: createOnOpen,
    onClose: createOnClose,
  } = useDisclosure();
  
  const projects = useStore((state) => state.projects);
  const [projectList, setProjectList] = useState<any[]>([]);
  const toast = useToast();

  const handleClose = useCallback(() => {
    createOnClose();
    getAllProjects().then((allProjects) => {
      if (allProjects?.projects && allProjects.projects.length) {
        setProjectList([...(allProjects.projects as [])]);
      }
    });
  }, [createOnClose, projectList]);

  const getData = useCallback(() => {
    getAllProjects().then((allProjects) => {
      setProjectList(allProjects?.projects || []);
    });
  }, []);

  useEffect(() => {
    getData();
  }, []);

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject({ projectId });
      
      toast({
        title: "删除成功",
        description: "项目已删除",
        status: "success",
        duration: 3000,
      });
      
      // 重新获取项目列表
      getData();
      
      return Promise.resolve();
    } catch (err: any) {
      toast({
        title: "删除失败",
        description: err.message,
        status: "error",
        duration: 3000,
      });
      
      return Promise.reject(err);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Button
          leftIcon={<FiPlus />}
          colorScheme="brand"
          alignSelf="flex-end"
          onClick={createOnOpen}
        >
          创建项目
        </Button>

        {projectList.length === 0 ? (
          <Text textAlign="center" color="gray.500">
            暂无项目，点击上方按钮创建新项目
          </Text>
        ) : (
          <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
            {projectList.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={() => handleDeleteProject(project.id)}
              />
            ))}
          </Grid>
        )}
      </VStack>

      <CreateProjectModal isOpen={createIsOpen} onClose={handleClose} />
    </Container>
  );
};

export default Projects;
