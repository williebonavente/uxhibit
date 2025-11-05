import { FigmaNode } from "@/lib/declaration/figmaInfo";
import { DetectedAccordion } from "@/lib/declaration/componentAlias";

export function detectAccordions(frame: FigmaNode): DetectedAccordion[] {
    const accordions: DetectedAccordion[] = [];

    function traverse(node: FigmaNode) {
        // Heuristic: Look for nodes named "accordion" or with componentType "Accordion"
        const isAccordionLike =
            /accordion/i.test(node.name) ||
            node.component?.componentTypes === "Accordion";

        if (isAccordionLike) {
            // Try to find a text label
            let label = "";
            if (node.children) {
                const textNode = node.children.find(
                    (child) => child.type === "TEXT" && child.characters
                );
                if (textNode && textNode.characters) label = textNode.characters;
            }
            accordions.push({
                id: node.id,
                label: label || node.name,
                nodeType: node.type,
                nodeName: node.name,
                kind: "accordion"
            });
        }

        // Recursively check children
        if (node.children) {
            node.children.forEach(traverse);
        }
    }

    traverse(frame);
    return accordions;
}