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
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { Upload, message } from "antd";
import { uploadImageGroups } from "../services/http";

const { Dragger } = Upload;

const UploadFolderModal = ({ isOpen, onClose, id }) => {
  const [files, setFiles] = useState<any[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const toast = useToast();
  useEffect(() => {
    setFiles([]);
  }, [isOpen]);
  const uploadProps: any = {
    name: "file",
    multiple: true,
    directory: true,
    listType: "picture",
    accept: "image/*",
    beforeUpload: (file) => {
      setFiles((prevFiles) => [...prevFiles, file]);
      return false; // 阻止自动上传
    },
    onChange(info) {
      const { status } = info.file;
      if (status === "done") {
        message.success(`${info.file.name} 文件上传成功`);
      } else if (status === "error") {
        message.error(`${info.file.name} 文件上传失败`);
      }
    },
  };

  const handleUpload = async () => {
    setUploadLoading(true);
    if (files.length === 0) {
      toast({
        title: "请上传文件夹",
        status: "warning",
        duration: 2000,
      });
      return;
    }
    let promises: Promise<any>[] = [];
    for (let i = 0; i < files.length; i++) {
      let timeName = files[i].name.split(".")[0];
      let timeStr = "";
      let key = "";
      if (timeName.includes("V")) {
        timeStr = timeName.split("V")[0];
        key = "V";
      }
      if (timeName.includes("T")) {
        timeStr = timeName.split("T")[0];
        key = "T";
      }
      for (let j = 0; j < files.length; j++) {
        let timeName2 = files[j].name.split(".")[0];
        let timeStr2 = "";
        if (files[j].name !== files[i].name) {
          if (timeName2.includes("V")) {
            timeStr2 = timeName2.split("V")[0];
          }
          if (timeName2.includes("T")) {
            timeStr2 = timeName2.split("T")[0];
          }
        }

        if (timeStr === timeStr2) {
          let formData = new FormData();
          formData.append("projectId", id); // 替换为实际的 projectId
          formData.append("visibleImage", files[i]); // 替换为实际的 visibleImage 文件
          formData.append("infraredImage", files[j]); // 替换为实际的 infraredImage 文件
          formData.append("visibleImageName", files[i].name);
          formData.append("infraredImageName", files[j].name);
          promises.push(uploadImageGroups(formData));
        }
      }
    }
    Promise.all(promises)
      .then((res) => {
        toast({
          title: "上传成功",
          status: "success",
          duration: 2000,
        });
      })
      .catch((error) => {
        toast({
          title: `上传失败`,
          description: `上传失败,请检查${
            JSON.parse(error.config.data).visibleImageName
          }和${JSON.parse(error.config.data).infraredImageName}文件是否正常`,
          status: "error",
          duration: 2000,
        });
      })
      .finally(() => {
        setUploadLoading(false);
        onClose();
      });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>上传文件夹</ModalHeader>
        <ModalCloseButton />
        <ModalBody maxH={400} overflowY="auto">
          <Dragger {...uploadProps}>
            <VStack spacing={2}>
              <Text>
                {files.length > 0
                  ? `已选择文件夹，包含 ${files.length} 个文件`
                  : "拖拽文件夹到此处，或点击选择文件夹"}
              </Text>
              <Text fontSize="sm" color="gray.500">
                支持 PNG、JPG、JPEG 格式
              </Text>
            </VStack>
          </Dragger>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            取消
          </Button>
          <Button
            colorScheme="brand"
            onClick={handleUpload}
            isDisabled={files.length === 0}
            isLoading={uploadLoading}
          >
            上传
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UploadFolderModal;
