import MenuIcon from '@mui/icons-material/Menu';
import { Avatar, CssBaseline, Grid, IconButton, Menu, MenuItem, Toolbar, Typography, styled } from '@mui/material'
import MuiAppBar from '@mui/material/AppBar'
import { useState } from 'react'

const drawerWidth = 240;

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));

export default function Appbar({ open, handleDrawerOpen }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const openMenu = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    }
    const handleClose = () => {
        setAnchorEl(null);
    }

    return (
        <>
            <CssBaseline />
            <AppBar position="fixed" open={open} >
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="open drawer"
                        onClick={handleDrawerOpen}
                        children={<MenuIcon />}
                        sx={{
                            marginRight: 5,
                            ...(open && { display: 'none' }),
                        }}
                    />

                    <Grid display='flex' alignItems='center' justifyContent='space-between' width='100%' >
                        <Typography variant="h6" noWrap component="div">
                            VIDEOFLIX
                        </Typography>

                        <IconButton onClick={handleClick}>
                            <Avatar />
                        </IconButton>

                        <Menu
                            id="basic-menu"
                            anchorEl={anchorEl}
                            open={openMenu}
                            onClose={handleClose}
                            MenuListProps={{
                                'aria-labelledby': 'basic-button',
                            }}
                        >
                            <MenuItem onClick={handleClose}>Profile</MenuItem>
                            <MenuItem onClick={handleClose}>My account</MenuItem>
                            <MenuItem onClick={handleClose}>Logout</MenuItem>
                        </Menu>
                    </Grid>
                </Toolbar>
            </AppBar>
        </>
    )
}