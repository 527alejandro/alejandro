# Build your first Angular app

This tutorial consists of lessons that introduce the Angular concepts you need to know to start coding in Angular.

You can do as many or as few as you would like and you can do them in any order.

## Before you start

For the best experience with this tutorial, review these requirements to make sure you have what you need to be successful.

<!-- markdownLint-disable MD001 -->

### Your experience

The lessons in this tutorial assume that you have experience with the following:

1.  **Created an HTML web page by editing the HTML directly.**
        This tutorial makes references to HTML elements and the Document Object Model (DOM). If these terms are not familiar, review HTML programming before you start this tutorial.
1.  **Programmed web site content in JavaScript.**
        This tutorial has many examples of TypeScript programming, which is based on JavaScript. TypeScript-specific features are explained, but familiarity with JavaScript programming is necessary to understand the lessons in this tutorial.
1.  **Read Cascading Style Sheet (CSS) content and understand how selectors are used.**
        This tutorial does not require any CSS coding, but if these terms are not familiar, review CSS and selectors before you start this tutorial.
1.  **Used command-line instructions to perform tasks on your computer.**
        Angular uses the Angular CLI to perform many tasks. This tutorial provides the commands to use and assumes that you know how to open the command line tool or terminal interface in which to use them. If you aren't sure how to use a command line tool or terminal interface, review that before starting this tutorial.

### Your equipment

These lessons can be completed by using a local installation of the Angular tools or by using StackBlitz in a web browser. Local Angular development can be completed on Windows, MacOS or Linux based systems.

## Conceptual preview of your first Angular app

The lessons in this tutorial create an Angular app that lists houses for rent and show the details of individual houses.
This app uses features that are common to many Angular apps.
<section class="lightbox">
  <img alt="Output of heroes dashboard" src="generated/images/guide/faa/homes-app-landing-page.png">
</section>

## Local development environment

Perform these steps in a command-line tool on the computer you want to use for this tutorial.

## Step 1 - Identify the version of `node.js` that Angular requires

Angular requires an active LTS or maintenance LTS version of Node. Let's confirm your version of `node.js`. For information about specific version requirements, see the engines property in the [package.json file](https://unpkg.com/browse/@angular/core@15.1.5/package.json).

From a **Terminal** window:
1. Run the following command: `node --version`
1. Confirm that the version number displayed meets the requirements.

## Step 2 - Install the correct version of `node.js` for Angular

If you do not have a version of `node.js` installed, please follow the [directions for installation on nodejs.org](https://nodejs.org/en/download/)


## Step 3 - Install the latest version of Angular

With `node.js` and `npm` installed, the next step is to install the [Angular CLI](/cli) which provides tooling for effective Angular development.

From a **Terminal** window:

1. Run the following command: `npm install -g @angular/cli`
1. Once the installation completes, the terminal window will display details of the Angular CLI version installed on your local computer.

## Step 4 - Install integrated development environment (IDE)

You are free to use any tool you prefer to build apps with Angular. We recommend the following:

1. [Visual Studio Code](https://code.visualstudio.com/)
2. As an optional, but recommended step you can further improve your developer experience by installing the [Angular Language Service](https://marketplace.visualstudio.com/items?itemName=Angular.ng-template)

## Lesson review

In this lesson, you learned about the app that you build in this tutorial and prepared your local computer to develop Angular apps.

## Next steps

*  [First Angular app lesson 1 - Hello world](tutorial/first-app/first-app-lesson-01)

## More information

For more information about the topics covered in this lesson, visit:

* [What is Angular](/guide/what-is-angular)
* [Angular CLI Reference](/cli)
