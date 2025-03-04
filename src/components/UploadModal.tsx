import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  Text,
  useToast,
  Box,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
} from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useStore } from "../store";
import { ImagePair } from "../types/project";
import React from "react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

const UploadModal = ({ isOpen, onClose, projectId }: UploadModalProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [visibleImage, setVisibleImage] = useState<File | null>(null);
  const [infraredImage, setInfraredImage] = useState<File | null>(null);
  const toast = useToast();
  const addImagePair = useStore((state) => state.addImagePair);

  const handleDrop = useCallback(
    (acceptedFiles: File[], type: "visible" | "infrared") => {
      if (acceptedFiles.length > 0) {
        if (type === "visible") {
          setVisibleImage(acceptedFiles[0]);
        } else {
          setInfraredImage(acceptedFiles[0]);
        }
      }
    },
    []
  );

  const visibleDropzone = useDropzone({
    onDrop: (files) => handleDrop(files, "visible"),
    accept: { "image/*": [".png", ".jpg", ".jpeg"] },
    maxFiles: 1,
  });

  const infraredDropzone = useDropzone({
    onDrop: (files) => handleDrop(files, "infrared"),
    accept: { "image/*": [".png", ".jpg", ".jpeg"] },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!visibleImage || !infraredImage) {
      toast({
        title: "请上传两张图片",
        status: "warning",
        duration: 2000,
      });
      return;
    }

    setIsUploading(true);
    try {
      const pairId = Date.now().toString();
      const imagePair: ImagePair = {
        id: pairId,
        projectId,
        visibleImage: {
          id: `${pairId}_visible`,
          name: visibleImage.name,
          url: URL.createObjectURL(visibleImage),
          type: "visible",
          annotations: [],
        },
        infraredImage: {
          id: `${pairId}_infrared`,
          name: infraredImage.name,
          url: URL.createObjectURL(infraredImage),
          type: "infrared",
          annotations: [],
        },
      };

      addImagePair(projectId, imagePair);
      toast({
        title: "上传成功",
        status: "success",
        duration: 2000,
      });
      onClose();
    } catch (error) {
      toast({
        title: "上传失败",
        description: "请稍后重试",
        status: "error",
        duration: 2000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>上传图片</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Tabs>
            <TabList>
              <Tab>可见光图像</Tab>
              <Tab>红外图像</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <DropzoneBox
                  {...visibleDropzone.getRootProps()}
                  isDragActive={visibleDropzone.isDragActive}
                  file={visibleImage}
                />
                <input {...visibleDropzone.getInputProps()} />
              </TabPanel>
              <TabPanel>
                <DropzoneBox
                  {...infraredDropzone.getRootProps()}
                  isDragActive={infraredDropzone.isDragActive}
                  file={infraredImage}
                />
                <input {...infraredDropzone.getInputProps()} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            取消
          </Button>
          <Button
            colorScheme="brand"
            onClick={handleUpload}
            isLoading={isUploading}
            isDisabled={!visibleImage || !infraredImage}
          >
            上传
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const DropzoneBox = ({ isDragActive, file, ...props }) => (
  <Box
    {...props}
    p={10}
    border="2px"
    borderRadius="lg"
    borderStyle="dashed"
    borderColor={isDragActive ? "brand.500" : "gray.200"}
    bg={isDragActive ? "brand.50" : undefined}
    cursor="pointer"
    transition="all 0.2s"
    _hover={{
      borderColor: "brand.500",
      bg: "brand.50",
    }}
  >
    <VStack spacing={2}>
      <Text>
        {file
          ? `已选择: ${file.name}`
          : isDragActive
          ? "放开以上传图片"
          : "拖拽图片到此处，或点击选择图片"}
      </Text>
      <Text fontSize="sm" color="gray.500">
        支持 PNG、JPG、JPEG 格式
      </Text>
    </VStack>
  </Box>
);

export default UploadModal;
