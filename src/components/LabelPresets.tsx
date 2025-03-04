import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Input,
  Badge,
  useColorMode,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@chakra-ui/react";
import { useState } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiSettings } from "react-icons/fi";
import { useStore } from "../store";
import React from "react";

interface LabelPreset {
  id: string;
  name: string;
  color: string;
  shortcut?: string;
}

const LabelPresets = () => {
  const { colorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newPreset, setNewPreset] = useState<Partial<LabelPreset>>({});
  const presets = useStore((state) => state.labelPresets);
  const currentLabel = useStore((state) => state.currentLabel);
  const setCurrentLabel = useStore((state) => state.setCurrentLabel);
  const addPreset = useStore((state) => state.addLabelPreset);
  const removePreset = useStore((state) => state.removeLabelPreset);

  return (
    <Box>
      <HStack mb={4} justify="space-between">
        <Text fontSize="sm" fontWeight="medium">
          预设标签
        </Text>
        <IconButton
          aria-label="管理预设"
          icon={<FiSettings />}
          size="sm"
          variant="ghost"
          onClick={onOpen}
        />
      </HStack>

      <VStack align="stretch" spacing={2}>
        {presets.map((preset) => (
          <HStack
            key={preset.id}
            p={2}
            borderRadius="md"
            bg={
              currentLabel?.id === preset.id
                ? `${preset.color}.500`
                : colorMode === "dark"
                ? "gray.700"
                : "gray.50"
            }
            color={currentLabel?.id === preset.id ? "white" : undefined}
            _hover={{
              bg:
                currentLabel?.id === preset.id
                  ? `${preset.color}.600`
                  : colorMode === "dark"
                  ? "gray.600"
                  : "gray.100",
            }}
            transition="all 0.2s"
            cursor="pointer"
            onClick={() =>
              setCurrentLabel(currentLabel?.id === preset.id ? null : preset)
            }
          >
            <Badge colorScheme={preset.color}>{preset.shortcut}</Badge>
            <Text flex="1" fontSize="sm">
              {preset.name}
            </Text>
          </HStack>
        ))}
        {presets.length === 0 && (
          <Text fontSize="sm" color="gray.500" textAlign="center" py={2}>
            暂无预设标签
          </Text>
        )}
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>管理预设标签</ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <Box w="100%">
                <Text mb={2} fontSize="sm">
                  添加新预设
                </Text>
                <HStack>
                  <Input
                    placeholder="标签名称"
                    value={newPreset.name || ""}
                    onChange={(e) =>
                      setNewPreset({ ...newPreset, name: e.target.value })
                    }
                    size="sm"
                  />
                  <Input
                    placeholder="快捷键"
                    value={newPreset.shortcut || ""}
                    onChange={(e) =>
                      setNewPreset({ ...newPreset, shortcut: e.target.value })
                    }
                    size="sm"
                    w="80px"
                  />
                  <IconButton
                    aria-label="添加预设"
                    icon={<FiPlus />}
                    size="sm"
                    onClick={() => {
                      if (newPreset.name) {
                        addPreset({
                          id: Date.now().toString(),
                          name: newPreset.name,
                          color: "blue",
                          shortcut: newPreset.shortcut,
                        });
                        setNewPreset({});
                      }
                    }}
                  />
                </HStack>
              </Box>

              <VStack w="100%" align="stretch">
                {presets.map((preset) => (
                  <HStack key={preset.id} justify="space-between">
                    <Text>{preset.name}</Text>
                    <HStack>
                      <Badge>{preset.shortcut}</Badge>
                      <IconButton
                        aria-label="删除预设"
                        icon={<FiTrash2 />}
                        size="xs"
                        variant="ghost"
                        onClick={() => removePreset(preset.id)}
                      />
                    </HStack>
                  </HStack>
                ))}
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>完成</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default LabelPresets;
