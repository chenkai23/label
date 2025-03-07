import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
} from "@chakra-ui/react";
import React, { useRef } from "react";

export function Alert({ onClose, isOpen, text, submit }) {
  const cancelRef = useRef<any>();
  return (
    <AlertDialog
      motionPreset="slideInBottom"
      leastDestructiveRef={cancelRef}
      onClose={onClose}
      isOpen={isOpen}
      isCentered
    >
      <AlertDialogOverlay />

      <AlertDialogContent>
        <AlertDialogHeader>警告</AlertDialogHeader>
        <AlertDialogCloseButton />
        <AlertDialogBody>{text}</AlertDialogBody>
        <AlertDialogFooter>
          <Button onClick={onClose}>取消</Button>
          <Button colorScheme="brand" ml={3} onClick={submit}>
            确定
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
