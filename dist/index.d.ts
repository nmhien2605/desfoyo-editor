import { z } from 'zod';
import * as react from 'react';
import opentype, { Font } from 'opentype.js';

declare const BlendModeSchema: z.ZodEnum<{
    normal: "normal";
    multiply: "multiply";
    screen: "screen";
    overlay: "overlay";
    darken: "darken";
    lighten: "lighten";
}>;
type BlendMode = z.infer<typeof BlendModeSchema>;
declare const TransformSchema: z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
    scaleX: z.ZodNumber;
    scaleY: z.ZodNumber;
    rotation: z.ZodNumber;
    skewX: z.ZodOptional<z.ZodNumber>;
    skewY: z.ZodOptional<z.ZodNumber>;
    originX: z.ZodOptional<z.ZodNumber>;
    originY: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
type Transform = z.infer<typeof TransformSchema>;
declare const SizeSchema: z.ZodObject<{
    width: z.ZodNumber;
    height: z.ZodNumber;
}, z.core.$strip>;
type Size = z.infer<typeof SizeSchema>;
declare const BaseNodeShape: {
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    transform: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        scaleX: z.ZodNumber;
        scaleY: z.ZodNumber;
        rotation: z.ZodNumber;
        skewX: z.ZodOptional<z.ZodNumber>;
        skewY: z.ZodOptional<z.ZodNumber>;
        originX: z.ZodOptional<z.ZodNumber>;
        originY: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
    size: z.ZodObject<{
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, z.core.$strip>;
    opacity: z.ZodNumber;
    visible: z.ZodBoolean;
    locked: z.ZodBoolean;
    blendMode: z.ZodOptional<z.ZodEnum<{
        normal: "normal";
        multiply: "multiply";
        screen: "screen";
        overlay: "overlay";
        darken: "darken";
        lighten: "lighten";
    }>>;
    effects: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"shadow">;
        color: z.ZodString;
        blur: z.ZodNumber;
        offset: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
        alpha: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"text-shadow">;
        style: z.ZodEnum<{
            drop: "drop";
            line: "line";
            block: "block";
            "3d": "3d";
        }>;
        color: z.ZodString;
        angle: z.ZodNumber;
        distance: z.ZodNumber;
        blur: z.ZodOptional<z.ZodNumber>;
        thickness: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"glow">;
        color: z.ZodString;
        strength: z.ZodNumber;
        outer: z.ZodBoolean;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"outline">;
        color: z.ZodString;
        thickness: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"extrude3d">;
        depth: z.ZodNumber;
        angle: z.ZodNumber;
        color: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"blur">;
        amount: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"custom">;
        shaderId: z.ZodString;
        uniforms: z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodNumber, z.ZodArray<z.ZodNumber>]>>;
    }, z.core.$strip>], "type">>>;
};
declare const BaseNodeSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    transform: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        scaleX: z.ZodNumber;
        scaleY: z.ZodNumber;
        rotation: z.ZodNumber;
        skewX: z.ZodOptional<z.ZodNumber>;
        skewY: z.ZodOptional<z.ZodNumber>;
        originX: z.ZodOptional<z.ZodNumber>;
        originY: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
    size: z.ZodObject<{
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, z.core.$strip>;
    opacity: z.ZodNumber;
    visible: z.ZodBoolean;
    locked: z.ZodBoolean;
    blendMode: z.ZodOptional<z.ZodEnum<{
        normal: "normal";
        multiply: "multiply";
        screen: "screen";
        overlay: "overlay";
        darken: "darken";
        lighten: "lighten";
    }>>;
    effects: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"shadow">;
        color: z.ZodString;
        blur: z.ZodNumber;
        offset: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
        alpha: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"text-shadow">;
        style: z.ZodEnum<{
            drop: "drop";
            line: "line";
            block: "block";
            "3d": "3d";
        }>;
        color: z.ZodString;
        angle: z.ZodNumber;
        distance: z.ZodNumber;
        blur: z.ZodOptional<z.ZodNumber>;
        thickness: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"glow">;
        color: z.ZodString;
        strength: z.ZodNumber;
        outer: z.ZodBoolean;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"outline">;
        color: z.ZodString;
        thickness: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"extrude3d">;
        depth: z.ZodNumber;
        angle: z.ZodNumber;
        color: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"blur">;
        amount: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"custom">;
        shaderId: z.ZodString;
        uniforms: z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodNumber, z.ZodArray<z.ZodNumber>]>>;
    }, z.core.$strip>], "type">>>;
}, z.core.$strip>;
type BaseNode = z.infer<typeof BaseNodeSchema>;

declare const EffectSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"shadow">;
    color: z.ZodString;
    blur: z.ZodNumber;
    offset: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    alpha: z.ZodNumber;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"text-shadow">;
    style: z.ZodEnum<{
        drop: "drop";
        line: "line";
        block: "block";
        "3d": "3d";
    }>;
    color: z.ZodString;
    angle: z.ZodNumber;
    distance: z.ZodNumber;
    blur: z.ZodOptional<z.ZodNumber>;
    thickness: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"glow">;
    color: z.ZodString;
    strength: z.ZodNumber;
    outer: z.ZodBoolean;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"outline">;
    color: z.ZodString;
    thickness: z.ZodNumber;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"extrude3d">;
    depth: z.ZodNumber;
    angle: z.ZodNumber;
    color: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"blur">;
    amount: z.ZodNumber;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"custom">;
    shaderId: z.ZodString;
    uniforms: z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodNumber, z.ZodArray<z.ZodNumber>]>>;
}, z.core.$strip>], "type">;
type Effect = z.infer<typeof EffectSchema>;

declare const GradientStopSchema: z.ZodObject<{
    offset: z.ZodNumber;
    color: z.ZodString;
    alpha: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
type GradientStop = z.infer<typeof GradientStopSchema>;
declare const FillSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"solid">;
    color: z.ZodString;
    alpha: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"linear-gradient">;
    stops: z.ZodArray<z.ZodObject<{
        offset: z.ZodNumber;
        color: z.ZodString;
        alpha: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    angle: z.ZodNumber;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"radial-gradient">;
    stops: z.ZodArray<z.ZodObject<{
        offset: z.ZodNumber;
        color: z.ZodString;
        alpha: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"texture">;
    assetId: z.ZodString;
    scale: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
}, z.core.$strip>], "type">;
type Fill = z.infer<typeof FillSchema>;
declare const StrokeSchema: z.ZodObject<{
    fill: z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"solid">;
        color: z.ZodString;
        alpha: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"linear-gradient">;
        stops: z.ZodArray<z.ZodObject<{
            offset: z.ZodNumber;
            color: z.ZodString;
            alpha: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        angle: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"radial-gradient">;
        stops: z.ZodArray<z.ZodObject<{
            offset: z.ZodNumber;
            color: z.ZodString;
            alpha: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"texture">;
        assetId: z.ZodString;
        scale: z.ZodOptional<z.ZodNumber>;
        offset: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
    }, z.core.$strip>], "type">;
    width: z.ZodNumber;
    align: z.ZodEnum<{
        inside: "inside";
        center: "center";
        outside: "outside";
    }>;
    layers: z.ZodOptional<z.ZodArray<z.ZodObject<{
        width: z.ZodNumber;
        fill: z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"solid">;
            color: z.ZodString;
            alpha: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"linear-gradient">;
            stops: z.ZodArray<z.ZodObject<{
                offset: z.ZodNumber;
                color: z.ZodString;
                alpha: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>>;
            angle: z.ZodNumber;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"radial-gradient">;
            stops: z.ZodArray<z.ZodObject<{
                offset: z.ZodNumber;
                color: z.ZodString;
                alpha: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"texture">;
            assetId: z.ZodString;
            scale: z.ZodOptional<z.ZodNumber>;
            offset: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
        }, z.core.$strip>], "type">;
        offset: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
type Stroke = z.infer<typeof StrokeSchema>;

declare const WarpAnchorSchema: z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
    in: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, z.core.$strip>>;
    out: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
type WarpAnchor = z.infer<typeof WarpAnchorSchema>;
declare const WarpPathSchema: z.ZodObject<{
    role: z.ZodEnum<{
        baseline: "baseline";
        top: "top";
        bottom: "bottom";
    }>;
    closed: z.ZodBoolean;
    anchors: z.ZodArray<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        in: z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, z.core.$strip>>;
        out: z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
type WarpPath = z.infer<typeof WarpPathSchema>;
declare const WarpTypeSchema: z.ZodEnum<{
    custom: "custom";
    angle: "angle";
    none: "none";
    wave: "wave";
    arch: "arch";
    rise: "rise";
    flag: "flag";
    circle: "circle";
    distort: "distort";
}>;
type WarpType = z.infer<typeof WarpTypeSchema>;
declare const CircleParamsSchema: z.ZodObject<{
    centerX: z.ZodNumber;
    centerY: z.ZodNumber;
    radius: z.ZodNumber;
}, z.core.$strip>;
type CircleParams = z.infer<typeof CircleParamsSchema>;
declare const WarpBodySchema: z.ZodObject<{
    type: z.ZodEnum<{
        custom: "custom";
        angle: "angle";
        none: "none";
        wave: "wave";
        arch: "arch";
        rise: "rise";
        flag: "flag";
        circle: "circle";
        distort: "distort";
    }>;
    curveHeight: z.ZodNumber;
    paths: z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<{
            baseline: "baseline";
            top: "top";
            bottom: "bottom";
        }>;
        closed: z.ZodBoolean;
        anchors: z.ZodArray<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            in: z.ZodOptional<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strip>>;
            out: z.ZodOptional<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>>;
    circle: z.ZodOptional<z.ZodObject<{
        centerX: z.ZodNumber;
        centerY: z.ZodNumber;
        radius: z.ZodNumber;
    }, z.core.$strip>>;
    directionInverted: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
declare const WarpSchema: z.ZodPreprocess<z.ZodObject<{
    type: z.ZodEnum<{
        custom: "custom";
        angle: "angle";
        none: "none";
        wave: "wave";
        arch: "arch";
        rise: "rise";
        flag: "flag";
        circle: "circle";
        distort: "distort";
    }>;
    curveHeight: z.ZodNumber;
    paths: z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<{
            baseline: "baseline";
            top: "top";
            bottom: "bottom";
        }>;
        closed: z.ZodBoolean;
        anchors: z.ZodArray<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            in: z.ZodOptional<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strip>>;
            out: z.ZodOptional<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>>;
    circle: z.ZodOptional<z.ZodObject<{
        centerX: z.ZodNumber;
        centerY: z.ZodNumber;
        radius: z.ZodNumber;
    }, z.core.$strip>>;
    directionInverted: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>>;
type Warp = z.infer<typeof WarpBodySchema>;

declare const ShapeNodeSchema: z.ZodObject<{
    type: z.ZodLiteral<"shape">;
    shape: z.ZodEnum<{
        line: "line";
        rect: "rect";
        ellipse: "ellipse";
        polygon: "polygon";
        star: "star";
        path: "path";
    }>;
    cornerRadius: z.ZodOptional<z.ZodNumber>;
    points: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    fill: z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"solid">;
        color: z.ZodString;
        alpha: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"linear-gradient">;
        stops: z.ZodArray<z.ZodObject<{
            offset: z.ZodNumber;
            color: z.ZodString;
            alpha: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        angle: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"radial-gradient">;
        stops: z.ZodArray<z.ZodObject<{
            offset: z.ZodNumber;
            color: z.ZodString;
            alpha: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"texture">;
        assetId: z.ZodString;
        scale: z.ZodOptional<z.ZodNumber>;
        offset: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
    }, z.core.$strip>], "type">;
    stroke: z.ZodOptional<z.ZodObject<{
        fill: z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"solid">;
            color: z.ZodString;
            alpha: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"linear-gradient">;
            stops: z.ZodArray<z.ZodObject<{
                offset: z.ZodNumber;
                color: z.ZodString;
                alpha: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>>;
            angle: z.ZodNumber;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"radial-gradient">;
            stops: z.ZodArray<z.ZodObject<{
                offset: z.ZodNumber;
                color: z.ZodString;
                alpha: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"texture">;
            assetId: z.ZodString;
            scale: z.ZodOptional<z.ZodNumber>;
            offset: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
        }, z.core.$strip>], "type">;
        width: z.ZodNumber;
        align: z.ZodEnum<{
            inside: "inside";
            center: "center";
            outside: "outside";
        }>;
        layers: z.ZodOptional<z.ZodArray<z.ZodObject<{
            width: z.ZodNumber;
            fill: z.ZodDiscriminatedUnion<[z.ZodObject<{
                type: z.ZodLiteral<"solid">;
                color: z.ZodString;
                alpha: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"linear-gradient">;
                stops: z.ZodArray<z.ZodObject<{
                    offset: z.ZodNumber;
                    color: z.ZodString;
                    alpha: z.ZodOptional<z.ZodNumber>;
                }, z.core.$strip>>;
                angle: z.ZodNumber;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"radial-gradient">;
                stops: z.ZodArray<z.ZodObject<{
                    offset: z.ZodNumber;
                    color: z.ZodString;
                    alpha: z.ZodOptional<z.ZodNumber>;
                }, z.core.$strip>>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"texture">;
                assetId: z.ZodString;
                scale: z.ZodOptional<z.ZodNumber>;
                offset: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
            }, z.core.$strip>], "type">;
            offset: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    transform: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        scaleX: z.ZodNumber;
        scaleY: z.ZodNumber;
        rotation: z.ZodNumber;
        skewX: z.ZodOptional<z.ZodNumber>;
        skewY: z.ZodOptional<z.ZodNumber>;
        originX: z.ZodOptional<z.ZodNumber>;
        originY: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
    size: z.ZodObject<{
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, z.core.$strip>;
    opacity: z.ZodNumber;
    visible: z.ZodBoolean;
    locked: z.ZodBoolean;
    blendMode: z.ZodOptional<z.ZodEnum<{
        normal: "normal";
        multiply: "multiply";
        screen: "screen";
        overlay: "overlay";
        darken: "darken";
        lighten: "lighten";
    }>>;
    effects: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"shadow">;
        color: z.ZodString;
        blur: z.ZodNumber;
        offset: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
        alpha: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"text-shadow">;
        style: z.ZodEnum<{
            drop: "drop";
            line: "line";
            block: "block";
            "3d": "3d";
        }>;
        color: z.ZodString;
        angle: z.ZodNumber;
        distance: z.ZodNumber;
        blur: z.ZodOptional<z.ZodNumber>;
        thickness: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"glow">;
        color: z.ZodString;
        strength: z.ZodNumber;
        outer: z.ZodBoolean;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"outline">;
        color: z.ZodString;
        thickness: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"extrude3d">;
        depth: z.ZodNumber;
        angle: z.ZodNumber;
        color: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"blur">;
        amount: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"custom">;
        shaderId: z.ZodString;
        uniforms: z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodNumber, z.ZodArray<z.ZodNumber>]>>;
    }, z.core.$strip>], "type">>>;
}, z.core.$strip>;
type ShapeNode = z.infer<typeof ShapeNodeSchema>;
declare const ImageNodeSchema: z.ZodObject<{
    type: z.ZodLiteral<"image">;
    assetId: z.ZodString;
    crop: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, z.core.$strip>>;
    mask: z.ZodOptional<z.ZodObject<{
        type: z.ZodLiteral<"shape">;
        ref: z.ZodString;
    }, z.core.$strip>>;
    filters: z.ZodOptional<z.ZodObject<{
        brightness: z.ZodOptional<z.ZodNumber>;
        contrast: z.ZodOptional<z.ZodNumber>;
        blur: z.ZodOptional<z.ZodNumber>;
        saturation: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    transform: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        scaleX: z.ZodNumber;
        scaleY: z.ZodNumber;
        rotation: z.ZodNumber;
        skewX: z.ZodOptional<z.ZodNumber>;
        skewY: z.ZodOptional<z.ZodNumber>;
        originX: z.ZodOptional<z.ZodNumber>;
        originY: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
    size: z.ZodObject<{
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, z.core.$strip>;
    opacity: z.ZodNumber;
    visible: z.ZodBoolean;
    locked: z.ZodBoolean;
    blendMode: z.ZodOptional<z.ZodEnum<{
        normal: "normal";
        multiply: "multiply";
        screen: "screen";
        overlay: "overlay";
        darken: "darken";
        lighten: "lighten";
    }>>;
    effects: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"shadow">;
        color: z.ZodString;
        blur: z.ZodNumber;
        offset: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
        alpha: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"text-shadow">;
        style: z.ZodEnum<{
            drop: "drop";
            line: "line";
            block: "block";
            "3d": "3d";
        }>;
        color: z.ZodString;
        angle: z.ZodNumber;
        distance: z.ZodNumber;
        blur: z.ZodOptional<z.ZodNumber>;
        thickness: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"glow">;
        color: z.ZodString;
        strength: z.ZodNumber;
        outer: z.ZodBoolean;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"outline">;
        color: z.ZodString;
        thickness: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"extrude3d">;
        depth: z.ZodNumber;
        angle: z.ZodNumber;
        color: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"blur">;
        amount: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"custom">;
        shaderId: z.ZodString;
        uniforms: z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodNumber, z.ZodArray<z.ZodNumber>]>>;
    }, z.core.$strip>], "type">>>;
}, z.core.$strip>;
type ImageNode = z.infer<typeof ImageNodeSchema>;
declare const SvgNodeSchema: z.ZodObject<{
    type: z.ZodLiteral<"svg">;
    assetId: z.ZodString;
    overrides: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"solid">;
        color: z.ZodString;
        alpha: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"linear-gradient">;
        stops: z.ZodArray<z.ZodObject<{
            offset: z.ZodNumber;
            color: z.ZodString;
            alpha: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        angle: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"radial-gradient">;
        stops: z.ZodArray<z.ZodObject<{
            offset: z.ZodNumber;
            color: z.ZodString;
            alpha: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"texture">;
        assetId: z.ZodString;
        scale: z.ZodOptional<z.ZodNumber>;
        offset: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
    }, z.core.$strip>], "type">>>;
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    transform: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        scaleX: z.ZodNumber;
        scaleY: z.ZodNumber;
        rotation: z.ZodNumber;
        skewX: z.ZodOptional<z.ZodNumber>;
        skewY: z.ZodOptional<z.ZodNumber>;
        originX: z.ZodOptional<z.ZodNumber>;
        originY: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
    size: z.ZodObject<{
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, z.core.$strip>;
    opacity: z.ZodNumber;
    visible: z.ZodBoolean;
    locked: z.ZodBoolean;
    blendMode: z.ZodOptional<z.ZodEnum<{
        normal: "normal";
        multiply: "multiply";
        screen: "screen";
        overlay: "overlay";
        darken: "darken";
        lighten: "lighten";
    }>>;
    effects: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"shadow">;
        color: z.ZodString;
        blur: z.ZodNumber;
        offset: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
        alpha: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"text-shadow">;
        style: z.ZodEnum<{
            drop: "drop";
            line: "line";
            block: "block";
            "3d": "3d";
        }>;
        color: z.ZodString;
        angle: z.ZodNumber;
        distance: z.ZodNumber;
        blur: z.ZodOptional<z.ZodNumber>;
        thickness: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"glow">;
        color: z.ZodString;
        strength: z.ZodNumber;
        outer: z.ZodBoolean;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"outline">;
        color: z.ZodString;
        thickness: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"extrude3d">;
        depth: z.ZodNumber;
        angle: z.ZodNumber;
        color: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"blur">;
        amount: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"custom">;
        shaderId: z.ZodString;
        uniforms: z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodNumber, z.ZodArray<z.ZodNumber>]>>;
    }, z.core.$strip>], "type">>>;
}, z.core.$strip>;
type SvgNode = z.infer<typeof SvgNodeSchema>;
declare const TextNodeSchema: z.ZodObject<{
    type: z.ZodLiteral<"text">;
    text: z.ZodString;
    font: z.ZodObject<{
        family: z.ZodString;
        weight: z.ZodNumber;
        style: z.ZodEnum<{
            normal: "normal";
            italic: "italic";
        }>;
        size: z.ZodNumber;
    }, z.core.$strip>;
    align: z.ZodEnum<{
        center: "center";
        left: "left";
        right: "right";
    }>;
    letterSpacing: z.ZodNumber;
    lineHeight: z.ZodNumber;
    fill: z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"solid">;
        color: z.ZodString;
        alpha: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"linear-gradient">;
        stops: z.ZodArray<z.ZodObject<{
            offset: z.ZodNumber;
            color: z.ZodString;
            alpha: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        angle: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"radial-gradient">;
        stops: z.ZodArray<z.ZodObject<{
            offset: z.ZodNumber;
            color: z.ZodString;
            alpha: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"texture">;
        assetId: z.ZodString;
        scale: z.ZodOptional<z.ZodNumber>;
        offset: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
    }, z.core.$strip>], "type">;
    warp: z.ZodOptional<z.ZodPreprocess<z.ZodObject<{
        type: z.ZodEnum<{
            custom: "custom";
            angle: "angle";
            none: "none";
            wave: "wave";
            arch: "arch";
            rise: "rise";
            flag: "flag";
            circle: "circle";
            distort: "distort";
        }>;
        curveHeight: z.ZodNumber;
        paths: z.ZodOptional<z.ZodArray<z.ZodObject<{
            role: z.ZodEnum<{
                baseline: "baseline";
                top: "top";
                bottom: "bottom";
            }>;
            closed: z.ZodBoolean;
            anchors: z.ZodArray<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
                in: z.ZodOptional<z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, z.core.$strip>>;
                out: z.ZodOptional<z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, z.core.$strip>>;
            }, z.core.$strip>>;
        }, z.core.$strip>>>;
        circle: z.ZodOptional<z.ZodObject<{
            centerX: z.ZodNumber;
            centerY: z.ZodNumber;
            radius: z.ZodNumber;
        }, z.core.$strip>>;
        directionInverted: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>>;
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    transform: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        scaleX: z.ZodNumber;
        scaleY: z.ZodNumber;
        rotation: z.ZodNumber;
        skewX: z.ZodOptional<z.ZodNumber>;
        skewY: z.ZodOptional<z.ZodNumber>;
        originX: z.ZodOptional<z.ZodNumber>;
        originY: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
    size: z.ZodObject<{
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, z.core.$strip>;
    opacity: z.ZodNumber;
    visible: z.ZodBoolean;
    locked: z.ZodBoolean;
    blendMode: z.ZodOptional<z.ZodEnum<{
        normal: "normal";
        multiply: "multiply";
        screen: "screen";
        overlay: "overlay";
        darken: "darken";
        lighten: "lighten";
    }>>;
    effects: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"shadow">;
        color: z.ZodString;
        blur: z.ZodNumber;
        offset: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
        alpha: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"text-shadow">;
        style: z.ZodEnum<{
            drop: "drop";
            line: "line";
            block: "block";
            "3d": "3d";
        }>;
        color: z.ZodString;
        angle: z.ZodNumber;
        distance: z.ZodNumber;
        blur: z.ZodOptional<z.ZodNumber>;
        thickness: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"glow">;
        color: z.ZodString;
        strength: z.ZodNumber;
        outer: z.ZodBoolean;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"outline">;
        color: z.ZodString;
        thickness: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"extrude3d">;
        depth: z.ZodNumber;
        angle: z.ZodNumber;
        color: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"blur">;
        amount: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"custom">;
        shaderId: z.ZodString;
        uniforms: z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodNumber, z.ZodArray<z.ZodNumber>]>>;
    }, z.core.$strip>], "type">>>;
}, z.core.$strip>;
type TextNode = z.infer<typeof TextNodeSchema>;
interface GroupNode extends BaseNode {
    type: 'group';
    children: Node[];
}
declare const GroupNodeSchema: z.ZodObject<{
    type: z.ZodLiteral<"group">;
    children: z.ZodLazy<z.ZodArray<z.ZodType<Node, unknown, z.core.$ZodTypeInternals<Node, unknown>>>>;
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    transform: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        scaleX: z.ZodNumber;
        scaleY: z.ZodNumber;
        rotation: z.ZodNumber;
        skewX: z.ZodOptional<z.ZodNumber>;
        skewY: z.ZodOptional<z.ZodNumber>;
        originX: z.ZodOptional<z.ZodNumber>;
        originY: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
    size: z.ZodObject<{
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, z.core.$strip>;
    opacity: z.ZodNumber;
    visible: z.ZodBoolean;
    locked: z.ZodBoolean;
    blendMode: z.ZodOptional<z.ZodEnum<{
        normal: "normal";
        multiply: "multiply";
        screen: "screen";
        overlay: "overlay";
        darken: "darken";
        lighten: "lighten";
    }>>;
    effects: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"shadow">;
        color: z.ZodString;
        blur: z.ZodNumber;
        offset: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
        alpha: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"text-shadow">;
        style: z.ZodEnum<{
            drop: "drop";
            line: "line";
            block: "block";
            "3d": "3d";
        }>;
        color: z.ZodString;
        angle: z.ZodNumber;
        distance: z.ZodNumber;
        blur: z.ZodOptional<z.ZodNumber>;
        thickness: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"glow">;
        color: z.ZodString;
        strength: z.ZodNumber;
        outer: z.ZodBoolean;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"outline">;
        color: z.ZodString;
        thickness: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"extrude3d">;
        depth: z.ZodNumber;
        angle: z.ZodNumber;
        color: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"blur">;
        amount: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"custom">;
        shaderId: z.ZodString;
        uniforms: z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodNumber, z.ZodArray<z.ZodNumber>]>>;
    }, z.core.$strip>], "type">>>;
}, z.core.$strip>;
declare const NodeSchema: z.ZodType<Node>;
type Node = ShapeNode | ImageNode | SvgNode | TextNode | GroupNode;

declare const PageBackgroundSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"color">;
    value: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"fill">;
    value: z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"solid">;
        color: z.ZodString;
        alpha: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"linear-gradient">;
        stops: z.ZodArray<z.ZodObject<{
            offset: z.ZodNumber;
            color: z.ZodString;
            alpha: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        angle: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"radial-gradient">;
        stops: z.ZodArray<z.ZodObject<{
            offset: z.ZodNumber;
            color: z.ZodString;
            alpha: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"texture">;
        assetId: z.ZodString;
        scale: z.ZodOptional<z.ZodNumber>;
        offset: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
    }, z.core.$strip>], "type">;
}, z.core.$strip>], "type">;
type PageBackground = z.infer<typeof PageBackgroundSchema>;
declare const PageSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    size: z.ZodObject<{
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, z.core.$strip>;
    background: z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"color">;
        value: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"fill">;
        value: z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"solid">;
            color: z.ZodString;
            alpha: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"linear-gradient">;
            stops: z.ZodArray<z.ZodObject<{
                offset: z.ZodNumber;
                color: z.ZodString;
                alpha: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>>;
            angle: z.ZodNumber;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"radial-gradient">;
            stops: z.ZodArray<z.ZodObject<{
                offset: z.ZodNumber;
                color: z.ZodString;
                alpha: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"texture">;
            assetId: z.ZodString;
            scale: z.ZodOptional<z.ZodNumber>;
            offset: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
        }, z.core.$strip>], "type">;
    }, z.core.$strip>], "type">;
    children: z.ZodArray<z.ZodType<Node, unknown, z.core.$ZodTypeInternals<Node, unknown>>>;
}, z.core.$strip>;
type Page = z.infer<typeof PageSchema>;

declare const AssetRefSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"image">;
    dataUri: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"svg">;
    dataUri: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"image-url">;
    src: z.ZodString;
}, z.core.$strip>], "type">;
type AssetRef = z.infer<typeof AssetRefSchema>;
declare const DocumentMetaSchema: z.ZodObject<{
    title: z.ZodString;
    createdAt: z.ZodNumber;
    updatedAt: z.ZodNumber;
}, z.core.$strip>;
type DocumentMeta = z.infer<typeof DocumentMetaSchema>;
declare const DocumentSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    id: z.ZodString;
    meta: z.ZodObject<{
        title: z.ZodString;
        createdAt: z.ZodNumber;
        updatedAt: z.ZodNumber;
    }, z.core.$strip>;
    pages: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        size: z.ZodObject<{
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, z.core.$strip>;
        background: z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"color">;
            value: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"fill">;
            value: z.ZodDiscriminatedUnion<[z.ZodObject<{
                type: z.ZodLiteral<"solid">;
                color: z.ZodString;
                alpha: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"linear-gradient">;
                stops: z.ZodArray<z.ZodObject<{
                    offset: z.ZodNumber;
                    color: z.ZodString;
                    alpha: z.ZodOptional<z.ZodNumber>;
                }, z.core.$strip>>;
                angle: z.ZodNumber;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"radial-gradient">;
                stops: z.ZodArray<z.ZodObject<{
                    offset: z.ZodNumber;
                    color: z.ZodString;
                    alpha: z.ZodOptional<z.ZodNumber>;
                }, z.core.$strip>>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"texture">;
                assetId: z.ZodString;
                scale: z.ZodOptional<z.ZodNumber>;
                offset: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
            }, z.core.$strip>], "type">;
        }, z.core.$strip>], "type">;
        children: z.ZodArray<z.ZodType<Node, unknown, z.core.$ZodTypeInternals<Node, unknown>>>;
    }, z.core.$strip>>;
    assets: z.ZodRecord<z.ZodString, z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"image">;
        dataUri: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"svg">;
        dataUri: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"image-url">;
        src: z.ZodString;
    }, z.core.$strip>], "type">>;
}, z.core.$strip>;
type Document = z.infer<typeof DocumentSchema>;

type HistoryAction = 'push' | 'undo' | 'redo' | 'reset';

type DevMenuConfig = {
    sampleNames: string[];
    activeSample: string;
    onSampleChange: (name: string) => void;
};

interface EditorHandle {
    getDocument(): Document;
    loadDocument(doc: Document): void;
    export(format: 'png' | 'svg', scale?: number): Promise<Blob>;
    /** The page as a fresh canvas (page.size × scale) — same pixels as export('png') without the PNG encode. */
    exportCanvas(scale?: number): Promise<HTMLCanvasElement>;
    undo(): void;
    redo(): void;
    canUndo(): boolean;
    canRedo(): boolean;
    /** Adds or overwrites an asset. Not undoable (undoing the AddNode that uses it keeps the asset, so redo works). */
    addAsset(assetId: string, asset: AssetRef): void;
    addNode(node: Node, opts?: {
        pageId?: string;
        parentId?: string | null;
        index?: number;
    }): void;
    removeNode(nodeId: string, opts?: {
        pageId?: string;
        parentId?: string | null;
    }): void;
    updateNodeProps(nodeId: string, patch: Partial<Node>, opts?: {
        pageId?: string;
    }): void;
    updateNodeTransform(nodeId: string, patch: Partial<Transform>, opts?: {
        pageId?: string;
    }): void;
    reorderNode(nodeId: string, to: 'up' | 'down' | 'top' | 'bottom', opts?: {
        pageId?: string;
        parentId?: string | null;
    }): void;
    /** Replaces the current selection; an empty array clears it. */
    selectNode(nodeIds: string[]): void;
    groupSelection(): void;
    ungroupSelection(): void;
    deleteSelection(): void;
    duplicateSelection(): void;
    copySelection(): void;
    cutSelection(): void;
    pasteClipboard(): void;
}
interface EditorProps {
    document: Document;
    onChange?: (doc: Document) => void;
    onSelectionChange?: (nodeIds: string[]) => void;
    className?: string;
    devMenu?: DevMenuConfig;
    onExport?: (format: 'png' | 'svg') => void;
    initialSelectedNodeIds?: string[];
    /** undefined keeps every built-in keyboard shortcut, false disables them all, a string[] whitelists which stay active. */
    shortcuts?: false | string[];
    /** Default true. false renders only the canvas + selection overlay (no sidebar, inspector, toolbars). */
    chrome?: boolean;
    /** When set, the canvas is page.size × viewScale CSS px and wheel zoom / pan / zoom shortcuts are disabled. Live-updatable. */
    viewScale?: number;
    /** Called on double-click of a selected node. When provided, the built-in behaviour (inline text edit, image crop) runs only if it returns true. */
    onNodeDoubleClick?: (nodeId: string, nodeType: Node['type']) => boolean | void;
    /** Fires after every history change: a new edit ('push'), undo, redo, or loadDocument ('reset'). */
    onHistoryChange?: (history: HistoryState) => void;
}
interface HistoryState {
    canUndo: boolean;
    canRedo: boolean;
    pastLength: number;
    reason: HistoryAction;
}
declare const Editor: react.ForwardRefExoticComponent<EditorProps & react.RefAttributes<EditorHandle>>;

interface LoadedFont {
    family: string;
    font: opentype.Font;
}
declare function registerFont(family: string, source: string | ArrayBuffer): void;
declare function registeredFamilies(): string[];
declare function getLoadedFont(family: string): LoadedFont | null;
declare function onFontLoaded(cb: (family: string) => void): () => void;
declare function loadFont(family: string): Promise<LoadedFont | null>;

declare function measureText(node: TextNode, font: Font): {
    width: number;
    height: number;
};

declare function renderPageToPng(page: Page, doc: Document, scale?: number): Promise<Blob>;
declare function renderPageToSvg(page: Page, doc: Document): Promise<string>;

export { type AssetRef, AssetRefSchema, type BaseNode, BaseNodeSchema, BaseNodeShape, type BlendMode, BlendModeSchema, type CircleParams, CircleParamsSchema, type Document, type DocumentMeta, DocumentMetaSchema, DocumentSchema, Editor, type EditorHandle, type EditorProps, type Effect, EffectSchema, type Fill, FillSchema, type GradientStop, GradientStopSchema, type GroupNode, GroupNodeSchema, type HistoryState, type ImageNode, ImageNodeSchema, type LoadedFont, type Node, NodeSchema, type Page, type PageBackground, PageBackgroundSchema, PageSchema, type ShapeNode, ShapeNodeSchema, type Size, SizeSchema, type Stroke, StrokeSchema, type SvgNode, SvgNodeSchema, type TextNode, TextNodeSchema, type Transform, TransformSchema, type Warp, type WarpAnchor, WarpAnchorSchema, type WarpPath, WarpPathSchema, WarpSchema, type WarpType, WarpTypeSchema, getLoadedFont, loadFont, measureText, onFontLoaded, registerFont, registeredFamilies, renderPageToPng, renderPageToSvg };
