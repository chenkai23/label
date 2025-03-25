import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  useToast,
  VStack,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Text,
} from "@chakra-ui/react";
import { FiCpu } from "react-icons/fi";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { autoAnnotate } from "../services/http";

interface AutoAnnotateButtonProps {
  imageInfoArr: {
    id: number;
    infraredImageId: string;
    infraredImageName: string;
    infraredNum: number;
    visibleImageId: string;
    visibleImageName: string;
    visibleNum: number;
  }[];
  onAnnotationsChange: () => void;
}

const AutoAnnotateButton = ({
  imageInfoArr,
  onAnnotationsChange,
}: AutoAnnotateButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [conf, setConf] = useState(0.5);
  const [iou, setIou] = useState(0.5);
  const toast = useToast();
  const { id } = useParams<{ id: string }>();

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
            conf,
            iou,
          })
        );
      });
      Promise.all(promises)
        .then((res) => {
          onAnnotationsChange();
          toast({
            title: "自动标注完成",
            description: `${res.length}个照片组完成标注`,
            status: "success",
            duration: 2000,
          });
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
      <MenuButton
        as={Button}
        w={20}
        leftIcon={<FiCpu />}
        isLoading={isLoading}
        loadingText="正在标注"
        variant="outline"
        size="sm"
        colorScheme="brand"
      >
        AI
      </MenuButton>
      <MenuList p={4}>
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between">
            <Text>置信度阈值</Text>
            <NumberInput
              size="sm"
              min={0}
              max={1}
              step={0.1}
              value={conf}
              onChange={(_, value) => setConf(value)}
              w="120px"
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </HStack>
          <HStack justify="space-between">
            <Text>IOU阈值</Text>
            <NumberInput
              size="sm"
              min={0}
              max={1}
              step={0.1}
              value={iou}
              onChange={(_, value) => setIou(value)}
              w="120px"
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </HStack>
          <Button
            colorScheme="brand"
            onClick={handleAutoAnnotate}
            isLoading={isLoading}
            loadingText="正在标注"
          >
            开始标注
          </Button>
        </VStack>
      </MenuList>
    </Menu>
  );
};

export default AutoAnnotateButton;
