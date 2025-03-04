import {
  Button,
  useToast,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { useState } from "react";
import { FiCpu, FiChevronDown } from "react-icons/fi";
import { Image, Annotation } from "../types/project";
import React from "react";

interface AutoAnnotateButtonProps {
  visibleImage: Image;
  infraredImage: Image;
  onAnnotationsChange: (
    annotations: Annotation[],
    type: "visible" | "infrared"
  ) => void;
}

const AutoAnnotateButton = ({
  visibleImage,
  infraredImage,
  onAnnotationsChange,
}: AutoAnnotateButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const getImageData = async (url: string) => {
    // 如果是 Blob URL，先获取 Blob 数据
    if (url.startsWith("blob:")) {
      const response = await fetch(url);
      const blob = await response.blob();

      // 将 Blob 转换为 base64
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }

    // 如果是普通 URL，直接返回
    return url;
  };

  const handleAutoAnnotate = async (type: "visible" | "infrared") => {
    setIsLoading(true);
    try {
      const image = type === "visible" ? visibleImage : infraredImage;

      // 获取图片数据
      const imageData = await getImageData(image.url);

      const response = await fetch(`http://localhost:5050/api/auto-annotate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId: image.id,
          imageUrl: imageData,
          type: type,
        }),
      });

      if (!response.ok) {
        throw new Error("自动标注失败");
      }

      const result = await response.json();

      if (result.annotations && result.annotations.length > 0) {
        // 合并现有标注和自动标注结果
        const newAnnotations = [
          ...image.annotations,
          ...result.annotations.map((ann) => ({
            ...ann,
            id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          })),
        ];

        onAnnotationsChange(newAnnotations, type);

        toast({
          title: "自动标注完成",
          description: `新增 ${result.annotations.length} 个标注`,
          status: "success",
          duration: 2000,
        });
      } else {
        toast({
          title: "未检测到目标",
          status: "info",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("Auto annotation error:", error);
      toast({
        title: "自动标注失败",
        description: "请稍后重试",
        status: "error",
        duration: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Menu>
      <Tooltip label="使用 AI 自动标注" placement="right">
        <MenuButton
          as={Button}
          leftIcon={<FiCpu />}
          rightIcon={<FiChevronDown />}
          isLoading={isLoading}
          loadingText="正在标注"
          variant="outline"
          size="sm"
          colorScheme="brand"
        >
          AI
        </MenuButton>
      </Tooltip>
      <MenuList>
        <MenuItem onClick={() => handleAutoAnnotate("visible")}>
          标注可见光图像
        </MenuItem>
        <MenuItem onClick={() => handleAutoAnnotate("infrared")}>
          标注红外图像
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default AutoAnnotateButton;
