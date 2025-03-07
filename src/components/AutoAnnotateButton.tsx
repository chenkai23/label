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
import { autoAnnotate, getImage } from "../services/http";
import { byteToImage } from "../utils/common";
import { useParams } from "react-router-dom";

interface AutoAnnotateButtonProps {
  // visibleImageArr: Image[];
  // infraredImageArr: Image[];
  imageInfoArr: {
    id: number;
    infraredImageId: string;
    infraredNum: number;
    visibleImageId: string;
    visibleImageName: string;
    visibleNum: number;
  }[];
  onAnnotationsChange: (
    annotations: Annotation[],
    type: "visible" | "infrared"
  ) => void;
}

const AutoAnnotateButton = ({
  imageInfoArr,
  onAnnotationsChange,
}: AutoAnnotateButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
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

  const handleAutoAnnotate = async () => {
    setIsLoading(true);
    try {
      let imageArr: { id: number; url: string; annotations: any[] }[] = [];
      imageArr = imageInfoArr.map((imageInfo) => ({
        id: imageInfo.id,
        url: "",
        annotations: [],
      }));
      let promises: Promise<any>[] = [];
      imageArr.forEach(async (image) => {
        promises.push(
          autoAnnotate({
            groupId: image.id,
            projectId: id,
          })
        );
      });
      Promise.all(promises)
        .then((res) => {
          toast({
            title: "自动标注完成",
            description: `${res.length}个照片组完成标注`,
            status: "success",
            duration: 2000,
          });
          // if (
          //   res.annotations.infrared.length ||
          //   res.annotations.visible.length
          // ) {
          //   toast({
          //     title: "自动标注完成",
          //     description: `新增 ${
          //       res.annotations.infrared.length +
          //       res.annotations.visible.length
          //     } 个标注`,
          //     status: "success",
          //     duration: 2000,
          //   });
          // } else {
          //   toast({
          //     title: "未检测到目标",
          //     status: "info",
          //     duration: 2000,
          //   });
          // }
        })
        .catch((error) => {
          toast({
            title: "自动标注失败",
            description: "请稍后重试",
            status: "error",
            duration: 2000,
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    } catch (error) {
      console.error("Auto annotation error:", error);
      toast({
        title: "自动标注失败",
        description: "请稍后重试",
        status: "error",
        duration: 2000,
      });
    }
  };

  return (
    <Menu>
      <Tooltip label="使用 AI 自动标注" placement="right">
        <Button
          w={20}
          leftIcon={<FiCpu />}
          isLoading={isLoading}
          loadingText="正在标注"
          variant="outline"
          size="sm"
          colorScheme="brand"
          onClick={() => handleAutoAnnotate()}
        >
          AI
        </Button>
      </Tooltip>
      {/* <MenuList>
        <MenuItem onClick={() => handleAutoAnnotate("visible")}>
          标注可见光图像
        </MenuItem>
        <MenuItem onClick={() => handleAutoAnnotate("infrared")}>
          标注红外图像
        </MenuItem>
      </MenuList> */}
    </Menu>
  );
};

export default AutoAnnotateButton;
