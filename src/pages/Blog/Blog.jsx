import React from 'react';
import '../../styles/Blog.css';

const Blog = () => {
  return (
    <div className="blog-page">
      <div className="coming-soon-container">
        <h1>Notre <span className="highlight">Blog</span></h1>
        <p>Des articles passionnants arrivent très bientôt...</p>
        <div className="loader-bar"></div>
      </div>
    </div>
  );
};

export default Blog;