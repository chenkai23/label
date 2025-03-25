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
import { Alert } from "../components/Alert";

const Projects = () => {
  const [selectProject, setSelectProject] = useState<any>();
  const {
    isOpen: createIsOpen,
    onOpen: createOnOpen,
    onClose: createOnClose,
  } = useDisclosure();
  const {
    isOpen: alertIsOpen,
    onOpen: alertOnOpen,
    onClose: alertOnClose,
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

  const alertClose = useCallback(() => {
    alertOnClose();
    setSelectProject(null);
    getData();
  }, [selectProject]);

  useEffect(() => {
    getData();
  }, []);
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

        {projects.length === 0 ? (
          <Text textAlign="center" color="gray.500">
            暂无项目，点击上方按钮创建新项目
          </Text>
        ) : (
          <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
            {projectList.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                deleteFunc={() => {
                  setSelectProject(project);
                  alertOnOpen();
                }}
              />
            ))}
          </Grid>
        )}
      </VStack>

      <CreateProjectModal isOpen={createIsOpen} onClose={handleClose} />
      <Alert
        isOpen={alertIsOpen}
        onClose={alertClose}
        text={"确定要删除该项目吗？"}
        submit={() => {
          deleteProject({ projectId: selectProject.id })
            .then(() => {
              alertClose();
              toast({
                title: "删除成功",
                description: "项目已删除",
                status: "success",
                duration: 3000,
              });
            })
            .catch((err) => {
              toast({
                title: "删除失败",
                description: err.message,
                status: "error",
                duration: 3000,
              });
            });
        }}
      ></Alert>
    </Container>
  );
};

export default Projects;
