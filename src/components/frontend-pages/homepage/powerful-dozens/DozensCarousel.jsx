
import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import { Link } from "react-router";
import "./carousel.css";
import { Box } from "@mui/material";

import Demo1 from 'src/assets/images/landingpage/demo-main.jpg';
import Demo2 from 'src/assets/images/landingpage/demo-dark.jpg';
import Demo3 from 'src/assets/images/landingpage/demo-rtl.jpg';
import Demo4 from 'src/assets/images/landingpage/demo-horizontal.jpg';

import App1 from 'src/assets/images/landingpage/app-chat.jpg';
import App2 from 'src/assets/images/landingpage/app-email.jpg';

const DozensCarousel = () => {
  const settings = {
    dots: false,
    arrows: false,
    infinite: true,
    speed: 4500,
    autoplay: true,
    slidesToShow: 4,
    slidesToScroll: 4,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <>
      <Slider {...settings} className="dozenscarousel">
        <div>
          <Box
            width={380}
            height={300}
            borderRadius="16px"
            sx={{ boxShadow: (theme) => theme.shadows[10] }}
          >
            <Link to="https://flexy-react-main.netlify.app/dashboards/dashboard1">
              <img
                src={Demo1}
                alt="user-img"
                width={380}
                height={300}
                style={{ borderRadius: "16px" }}
              />
            </Link>
          </Box>
        </div>
        <div>
          <Box
            width={380}
            height={300}
            borderRadius="16px"
            sx={{ boxShadow: (theme) => theme.shadows[10] }}
          >
            <Link to="https://flexy-react-dark.netlify.app/dashboards/dashboard1">
              <img
                src={Demo2}
                alt="user-img"
                width={380}
                height={300}
                style={{ borderRadius: "16px" }}
              />
            </Link>
          </Box>
        </div>
        <div>
          <Box
            width={380}
            height={300}
            borderRadius="16px"
            sx={{ boxShadow: (theme) => theme.shadows[10] }}
          >
            <Link to="https://flexy-react-rtl.netlify.app/dashboards/dashboard1">
              <img
                src={Demo3}
                alt="user-img"
                width={380}
                height={300}
                style={{ borderRadius: "16px" }}
              />
            </Link>
          </Box>
        </div>
        <div>
          <Box
            width={380}
            height={300}
            borderRadius="16px"
            sx={{ boxShadow: (theme) => theme.shadows[10] }}
          >
            <Link to="https://flexy-react-horizontal.netlify.app/dashboards/dashboard1">
              <img
                src={Demo4}
                alt="user-img"
                width={380}
                height={300}
                style={{ borderRadius: "16px" }}
              />
            </Link>
          </Box>
        </div>
        <div>
          <Box
            width={380}
            height={300}
            borderRadius="16px"
            sx={{ boxShadow: (theme) => theme.shadows[10] }}
          >
            <Link to="https://flexy-react-main.netlify.app/apps/chats">
              <img
                src={App1}
                alt="user-img"
                width={380}
                height={300}
                style={{ borderRadius: "16px" }}
              />
            </Link>
          </Box>
        </div>
        <div>
          <Box
            width={380}
            height={300}
            borderRadius="16px"
            sx={{ boxShadow: (theme) => theme.shadows[10] }}
          >
            <Link to="https://flexy-react-main.netlify.app/apps/email">
              <img
                src={App2}
                alt="user-img"
                width={380}
                height={300}
                style={{ borderRadius: "16px" }}
              />
            </Link>
          </Box>
        </div>
      </Slider>
    </>
  );
};

export default DozensCarousel;
