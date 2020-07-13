/** @jsx jsx */
import { jsx } from '@emotion/core';
import React, { useState, useEffect } from 'react';

import backgroundGradient from './background-gradient.svg';
import logoWhite from './logo-white.svg';
import logoColor from './logo-color.svg';

import '@fortawesome/fontawesome-free/js/all';

const fontFamily =
  '"Rubik", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';

const globalStyles = {
  paragraph: {
    fontFamily,
    lineHeight: 1.75,
    fontSize: 18
  },
  heading: {
    fontFamily,
    lineHeight: 1.5,
    textTransform: 'uppercase',
    fontWeight: 700,
    letterSpacing: 2,
    marginTop: 0,
    marginBottom: 0,
    fontSize: 24
  }
};

const Hero = ({ background, button }) => {
  const title = 'Answer Questions Using Data You Cannot See';
  const description = `OpenMined is an open-source community whose goal is to make the world more privacy-preserving by lowering the barrier-to-entry to private AI technologies.`;

  const styles = {
    container: {
      background:
        background === 'gradient' ? `url(${backgroundGradient})` : '#333',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      padding: 40,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    },
    logo: {
      width: 200,
      height: 'auto'
    },
    title: {
      color: 'white',
      marginTop: 40,
      width: 480,
      textAlign: 'center'
    },
    description: {
      color: 'white',
      marginTop: 40,
      marginBottom: 0,
      width: 480,
      textAlign: 'center'
    }
  };

  return (
    <div css={styles.container}>
      <img src={logoWhite} alt="OpenMined" css={styles.logo} />
      <h2 css={{ ...globalStyles.heading, ...styles.title }}>{title}</h2>
      <p css={{ ...globalStyles.paragraph, ...styles.description }}>
        {description}
      </p>
      {button && button}
    </div>
  );
};

const Vision = ({ button }) => {
  const title = 'Vision & Mission';
  const description = `
    <p>Industry standard tools for artificial intelligence have been designed with several assumptions: data is centralized into a single compute cluster, the cluster exists in a secure cloud, and the resulting models will be owned by a central authority. We envision a world in which we are not restricted to this scenario - a world in which AI tools treat privacy, security, and multi-owner governance as first class citizens.</p>
    <p><b>With OpenMined, an AI model can be governed by multiple owners and trained securely on an unseen, distributed dataset.</b></p>
    <p>The mission of the OpenMined community is to create an accessible ecosystem of tools for private, secure, multi-owner governed AI. We do this by extending popular libraries like TensorFlow and PyTorch with advanced techniques in cryptography and private machine learning.</p>
  `;

  const styles = {
    container: {
      padding: 40,
      maxWidth: 960,
      width: '90%',
      margin: '0 auto'
    }
  };

  return (
    <div css={styles.container}>
      <h4 css={globalStyles.heading}>{title}</h4>
      <div
        css={{ ...globalStyles.paragraph, marginBottom: -20 }}
        dangerouslySetInnerHTML={{ __html: description }}
      />
      {button && button}
    </div>
  );
};

const Button = ({ background, icon, onClick }) => (
  <button
    css={{
      fontFamily,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontWeight: 700,
      fontSize: 16,
      background: background === 'blue' ? '#62A4AE' : '#EEE',
      color: background === 'blue' ? '#FAFAFA' : '#333',
      appearance: 'none',
      border: 0,
      borderRadius: 4,
      padding: '15px 20px',
      marginTop: 40,
      marginBottom: 0,
      transition: 'background 0.2s ease-in-out',
      cursor: 'pointer',
      '&:hover': {
        background: background === 'blue' ? '#498B95' : '#DDD'
      },
      '&:focus': {
        outline: 0,
        boxShadow: 0,
        border: 0
      }
    }}
    onClick={onClick}
  >
    <span css={{ marginRight: 60 }}>Sign Up</span>
    {icon === 'arrow' && <i className="fas fa-arrow-right" />}
    {icon === 'user' && <i className="fas fa-user-plus" />}
    {icon === 'code' && <i className="fas fa-code" />}
  </button>
);

const Footer = () => {
  const styles = {
    wrapper: {
      background: '#333',
      padding: 40
    },
    container: {
      display: 'flex',
      justifyContent: 'space-between',
      width: 940,
      margin: '0 auto'
    },
    logo: {
      width: 200,
      height: 'auto'
    },
    social: {
      display: 'flex',
      alignItems: 'center'
    },
    socialIcon: {
      color: 'rgba(255, 255, 255, 0.5)',
      transition: 'color 0.2s ease-in-out',
      fontSize: 24,
      marginLeft: 20,
      '&:hover': {
        color: '#FFF'
      }
    }
  };
  return (
    <div css={styles.wrapper}>
      <div css={styles.container}>
        <img src={logoColor} alt="OpenMined" css={styles.logo} />
        <div css={styles.social}>
          <a
            href="https://github.com/OpenMined"
            target="_blank"
            css={styles.socialIcon}
          >
            <i className="fab fa-github" />
          </a>
          <a
            href="https://twitter.com/openminedorg"
            target="_blank"
            css={styles.socialIcon}
          >
            <i className="fab fa-twitter" />
          </a>
          <a
            href="https://youtube.com/c/OpenMinedOrg"
            target="_blank"
            css={styles.socialIcon}
          >
            <i className="fab fa-youtube" />
          </a>
          <a
            href="https://facebook.com/openminedorg"
            target="_blank"
            css={styles.socialIcon}
          >
            <i className="fab fa-facebook" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ({ isLoaded, config, onButtonClick, start }) => {
  useEffect(() => {
    start();
  }, []);

  if (isLoaded && config) {
    const button = (
      <Button
        background={config.buttonColor}
        icon={config.buttonIcon}
        onClick={onButtonClick}
      />
    );

    return (
      <div
        css={{
          minHeight: '100vh',
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto'
        }}
      >
        <Hero
          background={config.heroBackground}
          button={config.buttonPosition === 'hero' ? button : null}
        />
        <Vision button={config.buttonPosition === 'vision' ? button : null} />
        <Footer />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}
    >
      <i
        className="fas fa-circle-notch fa-spin fa-5x"
        style={{ color: '#ccc' }}
      ></i>
    </div>
  );
};
