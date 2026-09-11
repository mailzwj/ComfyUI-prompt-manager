from comfy_api.latest import ComfyExtension

WEB_DIRECTORY = "web"


class PromptManagerExtension(ComfyExtension):
    async def get_node_list(self):
        return []


def comfy_entrypoint():
    return PromptManagerExtension()
