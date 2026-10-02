# Adiciones: patrones creacionales

Este documento explica qué se agregó al taller de **Decorator** (plan móvil), dónde vive cada pieza y qué
limitaciones tiene la solución. El patrón Decorator original no se modificó.

## Resumen

| Patrón | Archivos nuevos | Qué hace en este proyecto |
|---|---|---|
| **Prototype** | `js/prototype/PlanConfig.js` (el prototipo con `clone()`), `js/prototype/PlanTemplateRegistry.js` | Un registro de plantillas de plan (por ejemplo "Estudiante conectado"). Siempre entrega un **clon**, nunca el objeto guardado, así que el usuario puede cambiarlo sin dañar la plantilla. También se clona un plan guardado para duplicarlo. |
| **Builder** | `js/builder/PlanBuilder.js` (incluye `PlanBuildError`) | Arma un plan paso a paso (`base`, `addon`, `named`) y valida todo en `build()`. Si algo falla, lanza `PlanBuildError` con **todos** los problemas juntos. Reemplaza la llamada directa a `buildPlan`. |
| **Abstract Factory** | `js/abstractFactory/SegmentFactory.js` (la fábrica abstracta y las tres concretas: Personal, Estudiante y Empresas), `js/abstractFactory/DiscountPolicy.js` y `js/abstractFactory/segments.js` (registro) | Cada segmento (Estudiante, Personal, Empresa) crea una **familia consistente**: catálogo de planes, catálogo de adicionales y política de descuento. |
| **Funcionalidad** | `js/features/SavedPlansStore.js` y cambios en `js/app.js`, `index.html`, `css/styles.css` | Selector de segmento, plantillas y "Mis planes" (guardar, cargar, duplicar y eliminar en `localStorage`). Une los tres patrones en la interfaz. |

## Cómo se conectan

```
Segmento elegido (Abstract Factory)
   -> define qué planes, adicionales y descuento hay disponibles
Plantilla o plan guardado (Prototype)
   -> se clona como PlanConfig {baseId, addonIds}
PlanBuilder (Builder)
   -> valida el PlanConfig y arma el plan con los decoradores existentes
Decorator (ya existía)
   -> calcula precio, datos, minutos y desglose
```

## Qué se hizo mal

**Se implementó en JavaScript, y la materia exige Java.** En clase se indicó que el desarrollo de esta asignatura
es en Java, no en otros lenguajes. Este proyecto y sus adiciones están en JavaScript, por lo que no cumplen ese requisito.

Consecuencias concretas de haberlo hecho en JavaScript:

- **Sin tipos estáticos.** Las interfaces y clases abstractas se simulan lanzando errores en tiempo de ejecución
  (por ejemplo `SegmentFactory` abstracta), no las verifica el compilador como en Java.
- **Abstract Factory más débil.** En Java los productos de la familia (`PlanCatalog`, `AddonCatalog`, `DiscountPolicy`) serían
  interfaces que el compilador obliga a cumplir. Aquí solo se cumplen por convención.
- **Prototype manual.** En Java se usaría `Cloneable` o un constructor de copia; aquí es un método `clone()` escrito a mano.
- **Sin backend.** Todo corre en el navegador y la persistencia es `localStorage`, no un servicio.
- **Pruebas distintas.** Se usa `node:test` en lugar de JUnit.

## Qué falta para cumplir con la materia

Portar las clases a Java (por ejemplo Spring Boot), conservando los mismos nombres y responsabilidades:
`PlanConfig` con constructor de copia, `PlanTemplateRegistry`, `PlanBuilder` con validación,
`SegmentFactory` como interfaz con tres implementaciones, y pruebas con JUnit. El diseño de este documento sirve de base.
