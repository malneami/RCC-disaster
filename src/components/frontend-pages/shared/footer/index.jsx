
import React from "react";
import {
  Box,
  Grid,
  Typography,
  Container,
  Divider,
  Stack,
  Tooltip,
} from "@mui/material";

import { Link } from "react-router";

import IconFacebook from 'src/assets/images/frontend-pages/icons/icon-facebook.svg';
import IconTwitter from 'src/assets/images/frontend-pages/icons/icon-twitter.svg';
import IconInstagram from 'src/assets/images/frontend-pages/icons/icon-instagram.svg';
import Logo from 'src/assets/images/logos/logoIcon.svg'
const footerLinks = [
  {
    id: 1,
    children: [
      {
        title: true,
        titleText: 'Applications',
      },
      {
        title: false,
        titleText: 'Kanban',
        link: '/apps/kanban',

      },
      {
        title: false,
        titleText: 'Invoice List',
        link: '/apps/invoice/list',
      },
      {
        title: false,
        titleText: 'eCommerce',
        link: '/apps/ecommerce/shop',
      },
      {
        title: false,
        titleText: 'Chat',
        link: '/apps/chats',
      },
      {
        title: false,
        titleText: 'Tickets',
        link: '/apps/tickets',
      },
      {
        title: false,
        titleText: 'Blog',
        link: '/frontend-pages/blog/',
      },
    ],
  },
  {
    id: 2,
    children: [
      {
        title: true,
        titleText: 'Forms',
      },
      {
        title: false,
        titleText: 'Form Layout',
        link: '/forms/form-layouts',
      },
      {
        title: false,
        titleText: 'Form Horizontal',
        link: '/forms/form-horizontal',
      },
      {
        title: false,
        titleText: 'Form Wizard',
        link: '/forms/form-wizard',
      },
      {
        title: false,
        titleText: 'Form Validation',
        link: '/forms/form-validation',
      },
      {
        title: false,
        titleText: 'Tiptap Editor',
        link: '/forms/form-tiptap',
      },
    ],
  },
  {
    id: 3,
    children: [
      {
        title: true,
        titleText: 'Tables',
      },
      {
        title: false,
        titleText: 'Basic Table',
        link: '/tables/basic',
      },
      {
        title: false,
        titleText: 'Fixed Header',
        link: '/tables/fixed-header',
      },
      {
        title: false,
        titleText: 'Pagination Table',
        link: '/tables/pagination',
      },
      {
        title: false,
        titleText: 'React Dense Table',
        link: '/react-tables/dense',
      },
      {
        title: false,
        titleText: 'Row Selection Table',
        link: '/react-tables/row-selection',
      },
      {
        title: false,
        titleText: 'Drag n Drop Table',
        link: '/react-tables/drag-drop',
      },
    ],
  },
];

const Footer = () => {
  return (<>
    <Container
      maxWidth="lg"
      sx={{
        pt: {
          xs: "30px",
          lg: "60px",
        },
      }}
    >
      <Grid container spacing={3} justifyContent="space-between" mb={7}>
        {footerLinks.map((footerlink, i) => (
          <Grid
            key={i}
            size={{
              xs: 6,
              sm: 4,
              lg: 2
            }}>
            {footerlink.children.map((child, i) => (
              <React.Fragment key={i}>
                {child.title ? (
                  <Typography fontSize="17px" fontWeight="600" mb="22px">
                    {child.titleText}
                  </Typography>
                ) : (
                  <Link to={`${child.link}`}>
                    <Typography
                      sx={{
                        display: "block",
                        padding: "10px 0",
                        fontSize: "15px",
                        color: (theme) => theme.palette.text.primary,
                        "&:hover": {
                          color: (theme) => theme.palette.primary.main,
                        },
                      }}
                      component="span"
                    >
                      {child.titleText}
                    </Typography>
                  </Link>
                )}
              </React.Fragment>
            ))}
          </Grid>
        ))}
        <Grid
          size={{
            xs: 6,
            sm: 6,
            lg: 2
          }}>
          <Typography fontSize="17px" fontWeight="600" mb="22px">
            Follow us
          </Typography>

          <Stack direction="row" gap="20px">
            <Tooltip title="Facebook">
              <Link to="#">
                <img
                  src={IconFacebook}
                  alt="facebook"
                  width={22}
                  height={22}
                />
              </Link>
            </Tooltip>
            <Tooltip title="Twitter">
              <Link to="#">
                <img
                  src={IconTwitter}
                  alt="twitter"
                  width={22}
                  height={22}
                />
              </Link>
            </Tooltip>
            <Tooltip title="Instagram">
              <Link to="#">
                <img
                  src={IconInstagram}
                  alt="instagram"
                  width={22}
                  height={22}
                />
              </Link>
            </Tooltip>
          </Stack>
        </Grid>
      </Grid>

      <Divider />

      <Box
        py="40px"
        flexWrap="wrap"
        display="flex"
        justifyContent="space-between"
      >
        <Stack direction="row" gap={1} alignItems="center">
          <img
            src={Logo}
            width={20}
            height={20}
            alt="logo"
          />
          <Typography variant="body1" fontSize="15px">
            All rights reserved by Flexy.{" "}
          </Typography>
        </Stack>
        <Typography variant="body1" fontSize="15px">
          Produced by{" "}
          <Typography component={Link} color="primary.main" to="https://wrappixel.com/">
            Wrappixel
          </Typography>
          .
        </Typography>
      </Box>
    </Container>
  </>);
};

export default Footer;
