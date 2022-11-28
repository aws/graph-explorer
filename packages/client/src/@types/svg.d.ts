declare module "@iconfu/svg-inject";

declare module "*.svg" {
  const content: any;
  export default content;
}
