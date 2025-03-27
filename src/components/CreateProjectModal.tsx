import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { useStore } from "../store";
import { Project } from "../types/project";
import React from "react";
import { createProject } from "../services/http";
import { RandomColor } from "../utils/common";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateProjectModal = ({ isOpen, onClose }: CreateProjectModalProps) => {
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const addProject = useStore((state) => state.addProject);
  const toast = useToast();

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "请输入项目名称",
        status: "error",
        duration: 2000,
      });
      return;
    }
    if (!label.trim()) {
      toast({
        title: "请输入标签",
        status: "error",
        duration: 2000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const newProject: Project = {
        id: Date.now().toString(),
        name: name.trim(),
        description: description.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
        imageCount: 0,
        images: [],
      };

      let labelArr = label.trim().split("-");
      let rgbColor = new RandomColor(labelArr.length).rgbArray;
      let tagArr = labelArr.map((tag, index) => {
        return {
          name: tag,
          color: rgbColor[index].color,
        };
      });
      
      // 先发送请求，成功后才添加到本地状态
      try {
        await createProject({
          name: name.trim(),
          tags: tagArr,
          description: description.trim(),
        });
        
        // 添加到本地状态
        addProject(newProject);
        
        toast({
          title: "项目创建成功",
          status: "success",
          duration: 2000,
        });
        
        // 清空表单
        setName("");
        setLabel("");
        setDescription("");
        
        // 关闭模态框
        onClose();
      } catch (err: any) {
        // 检查是否是项目名称重复错误
        if (err.response && err.response.data && err.response.data.error && 
            err.response.data.error.includes("项目名称已存在")) {
          toast({
            title: "项目名称重复",
            description: "请重新命名",
            status: "error",
            duration: 2000,
          });
          // 不关闭模态框，让用户修改名称
        } else {
          toast({
            title: "创建失败",
            description: "请稍后重试",
            status: "error",
            duration: 2000,
          });
          onClose();
        }
      }
    } catch (error) {
      toast({
        title: "创建失败",
        description: "请稍后重试",
        status: "error",
        duration: 2000,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>创建新项目</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>项目名称</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入项目名称"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>预设标签</FormLabel>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="输入预设标签，使用'-'分割，如'people-test-wall'"
              />
            </FormControl>
            <FormControl>
              <FormLabel>项目描述</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="输入项目描述"
                rows={4}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            取消
          </Button>
          <Button
            colorScheme="brand"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            创建
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateProjectModal;
