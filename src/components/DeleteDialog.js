import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Slide } from "@mui/material";
import { forwardRef } from "react";

const initialState = { data: {}, title: "", content: "", actionFunction: () => { } }

const Transition = forwardRef(function Transition(props, ref) {
    return <Slide direction="left" ref={ref} {...props} />;
});

export default function DeleteDialog({ open, setOpen, dialog, setDialog }) {
    const handleClickOk = () => {
        dialog.actionFunction()
        handleClose();
    };

    const handleClose = () => {
        setDialog(initialState)
        setOpen(false);
    };

    return (
        <Dialog
            open={open}
            TransitionComponent={Transition}
            keepMounted
            onClose={handleClose}
            aria-describedby="alert-dialog-slide-description"
        >
            <DialogTitle>{dialog.title}</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-slide-description">{dialog.content}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancelar</Button>
                <Button onClick={handleClickOk}>Sí, eliminar</Button>
            </DialogActions>
        </Dialog>
    )
}