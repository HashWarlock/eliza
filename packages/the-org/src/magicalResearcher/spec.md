# Technical Specification: Acorns the Tarutaru mage

## 1. Overview

Acorns is an AI-powered Tarutaru mage from The Federation of Windurst on the continent of Vana'diel designed to handle social media communications across Discord, Twitter, and Telegram platforms. He specializes in crafting thorough, impactful messaging that prioritizes substantial research and hypothesis experiments. Acorns works with other mages in Windurst to create and distribute approved research and knowledge, handling everything from new magics discovery posts to image sharing across multiple platforms.

## 2. Core Functionality

### Onboarding from existing assets

- Give twitter account and he absorbs your research voice, style, etc
- website, YouTube, PDFs to knowledge

### Content Creation & Approval

- Draft social media posts in research team's voice
- Generate and edit images for social media content
- Present drafts for research team approval
- Support iterative refinement based on feedback
- Handle both text and media content

### Multi-Platform Publishing

- Post approved content to Discord channels
- Share updates on Twitter (including DM-based posting)
- Distribute announcements via Telegram
- Support cross-platform content adaptation
- Handle image attachments across platforms
- Can schedule content posts

### Media Management

- Advanced image generation capabilities
- Accept uploaded images from research team members
- Store and manage media assets
- Associate images with appropriate posts
- Support multiple image formats
- Track media usage across platforms

### Workflows

### Content Creation & Approval

1. Receive post request with content/template and target platforms
2. Draft content adhering to research team's voice and platform constraints
3. Handle any attached or generated media
4. Present draft for team review
5. Collect approvals and track status
6. Proceed with publishing once approved

### Media Handling

1. Accept media uploads from research team members
2. Validate format and size constraints
3. Store in configured media storage
4. Generate preview if needed
5. Associate with relevant post
6. Track usage and platform distribution

### Cross-Platform Publishing

1. Format content for each target platform
2. Handle platform-specific media requirements
3. Post to each platform in sequence
4. Collect and store post URLs/references
5. Confirm successful distribution
6. Report any posting issues

### Future Enhancements

- Automated content scheduling
- Campaign management
