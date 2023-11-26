import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Slide } from "@mui/material";
import { Fragment, forwardRef } from "react";

const initialState = { id: "", title: "", content: "", actionFunction: () => { } }

const Transition = forwardRef(function Transition(props, ref) {
    return <Slide direction="left" ref={ref} {...props} />;
});

export default function DeleteDialog({ open, setOpen, data, setData }) {
    const handleClickOk = () => {
        data.actionFunction(data.id)
        handleClose();
    };

    const handleClose = () => {
        setOpen(false);
        setData(initialState)
    };

    return (
        <Fragment>
            <Dialog
                open={open}
                TransitionComponent={Transition}
                keepMounted
                onClose={handleClose}
                aria-describedby="alert-dialog-slide-description"
            >
                <DialogTitle>{data.title}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-slide-description">{data.content}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleClickOk}>Sí, eliminar</Button>
                </DialogActions>
            </Dialog>
        </Fragment>
    )
}