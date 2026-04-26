// import { useState } from "react";

// const anatomicalRegions = [
//   {
//     id: "brain",
//     name: "Brain & Nervous System",
//     desc: "Neurological scans and MRI.",
//   },
//   {
//     id: "lungs",
//     name: "Lungs & Respiratory",
//     desc: "Chest X-Rays and pulmonary scans.",
//   },
//   {
//     id: "heart",
//     name: "Heart & Cardiovascular",
//     desc: "Echocardiograms and cardiac MRI.",
//   },
//   {
//     id: "liver",
//     name: "Liver & Gallbladder",
//     desc: "Hepatic ultrasound and CT.",
//   },
//   {
//     id: "stomach",
//     name: "Stomach & Spleen",
//     desc: "Upper GI endoscopy and imaging.",
//   },
//   {
//     id: "intestines",
//     name: "Intestines & Bowel",
//     desc: "Lower GI and abdominal scans.",
//   },
//   {
//     id: "kidneys",
//     name: "Kidneys & Urinary",
//     desc: "Renal ultrasound and scan.",
//   },
//   {
//     id: "pelvis",
//     name: "Pelvic & Reproductive",
//     desc: "Cervical, uterine, and prostate exams.",
//   },
// ];

// export default function InteractiveAnatomyMap({
//   selectedOrgan,
//   onSelectOrgan,
// }) {
//   const [hoveredOrgan, setHoveredOrgan] = useState(null);

//   // Styling helper for SVG paths
//   const getOrganStyle = (id) => {
//     const isSelected = selectedOrgan === id;
//     const isHovered = hoveredOrgan === id;

//     if (isSelected)
//       return "fill-primary stroke-primary-focus drop-shadow-lg scale-[1.02] transform transition-all duration-300 origin-center cursor-pointer";
//     if (isHovered)
//       return "fill-secondary opacity-80 cursor-pointer transition-all duration-200";
//     return "fill-base-300 stroke-base-content/20 hover:fill-base-content/40 cursor-pointer transition-all duration-300";
//   };

//   return (
//     <div className="bg-base-100 border-base-200 flex w-full flex-col gap-8 rounded-2xl border p-6 shadow-sm lg:flex-row">
//       {/* LEFT: The SVG Interactive Map */}
//       <div className="bg-base-200/50 border-base-300 relative mx-auto flex w-full max-w-[350px] items-center justify-center rounded-xl border p-4 lg:w-1/2">
//         <svg
//           viewBox="0 0 400 800"
//           xmlns="http://www.w3.org/2000/svg"
//           className="h-auto max-h-[600px] w-full drop-shadow-md"
//         >
//           {/* Background Body Outline (Static) */}
//           <path
//             d="M 200 20 C 170 20 150 50 150 90 C 150 110 160 120 170 130 C 130 140 90 160 80 200 C 60 280 60 400 60 400 L 90 400 C 90 400 100 250 120 200 C 120 300 110 450 110 450 C 120 600 130 750 130 750 L 180 750 L 190 480 L 210 480 L 220 750 L 270 750 C 270 750 280 600 290 450 C 290 450 280 300 280 200 C 300 250 310 400 310 400 L 340 400 C 340 400 340 280 320 200 C 310 160 270 140 230 130 C 240 120 250 110 250 90 C 250 50 230 20 200 20 Z"
//             className="fill-base-100 stroke-base-300 stroke-[3px]"
//           />

//           {/* INTERNAL ORGANS (Interactive) */}
//           <g className="organs">
//             {/* Brain */}
//             <path
//               id="brain"
//               d="M 160 60 C 160 30 240 30 240 60 C 240 85 160 85 160 60 Z"
//               className={getOrganStyle("brain")}
//               onClick={() => onSelectOrgan("brain")}
//               onMouseEnter={() => setHoveredOrgan("brain")}
//               onMouseLeave={() => setHoveredOrgan(null)}
//             />

//             {/* Lungs (Left & Right grouped) */}
//             <g
//               id="lungs"
//               className={getOrganStyle("lungs")}
//               onClick={() => onSelectOrgan("lungs")}
//               onMouseEnter={() => setHoveredOrgan("lungs")}
//               onMouseLeave={() => setHoveredOrgan(null)}
//             >
//               <path d="M 140 160 C 120 200 130 250 160 260 C 180 260 170 180 160 160 Z" />
//               <path d="M 260 160 C 280 200 270 250 240 260 C 220 260 230 180 240 160 Z" />
//             </g>

//             {/* Heart */}
//             <path
//               id="heart"
//               d="M 185 190 C 185 190 170 210 185 230 C 210 240 220 210 200 190 C 190 180 185 190 185 190 Z"
//               className={getOrganStyle("heart")}
//               onClick={() => onSelectOrgan("heart")}
//               onMouseEnter={() => setHoveredOrgan("heart")}
//               onMouseLeave={() => setHoveredOrgan(null)}
//             />

//             {/* Liver */}
//             <path
//               id="liver"
//               d="M 140 270 C 140 250 220 260 240 290 C 240 310 170 300 140 270 Z"
//               className={getOrganStyle("liver")}
//               onClick={() => onSelectOrgan("liver")}
//               onMouseEnter={() => setHoveredOrgan("liver")}
//               onMouseLeave={() => setHoveredOrgan(null)}
//             />

//             {/* Stomach */}
//             <path
//               id="stomach"
//               d="M 210 270 C 240 270 260 290 250 310 C 230 320 200 300 210 270 Z"
//               className={getOrganStyle("stomach")}
//               onClick={() => onSelectOrgan("stomach")}
//               onMouseEnter={() => setHoveredOrgan("stomach")}
//               onMouseLeave={() => setHoveredOrgan(null)}
//             />

//             {/* Kidneys (Behind intestines usually, shown here for selection) */}
//             <g
//               id="kidneys"
//               className={getOrganStyle("kidneys")}
//               onClick={() => onSelectOrgan("kidneys")}
//               onMouseEnter={() => setHoveredOrgan("kidneys")}
//               onMouseLeave={() => setHoveredOrgan(null)}
//             >
//               <ellipse cx="160" cy="310" rx="15" ry="25" />
//               <ellipse cx="240" cy="310" rx="15" ry="25" />
//             </g>

//             {/* Intestines */}
//             <path
//               id="intestines"
//               d="M 140 330 C 130 380 270 380 260 330 C 250 360 150 360 140 330 Z"
//               className={getOrganStyle("intestines")}
//               onClick={() => onSelectOrgan("intestines")}
//               onMouseEnter={() => setHoveredOrgan("intestines")}
//               onMouseLeave={() => setHoveredOrgan(null)}
//             />

//             {/* Pelvic/Reproductive Area */}
//             <path
//               id="pelvis"
//               d="M 160 390 C 160 370 240 370 240 390 C 220 420 180 420 160 390 Z"
//               className={getOrganStyle("pelvis")}
//               onClick={() => onSelectOrgan("pelvis")}
//               onMouseEnter={() => setHoveredOrgan("pelvis")}
//               onMouseLeave={() => setHoveredOrgan(null)}
//             />
//           </g>
//         </svg>
//       </div>

//       {/* RIGHT: Text Highlighting & Information */}
//       <div className="flex w-full flex-col justify-center lg:w-1/2">
//         <h3 className="mb-4 text-2xl font-bold">Select Target Region</h3>
//         <p className="text-base-content/70 mb-6">
//           Hover over the anatomical model or select a region from the list below
//           to define the parameters of the AI scan.
//         </p>

//         <div className="flex flex-col gap-2">
//           {anatomicalRegions.map((region) => {
//             const isSelected = selectedOrgan === region.id;
//             const isHovered = hoveredOrgan === region.id;

//             return (
//               <div
//                 key={region.id}
//                 onClick={() => onSelectOrgan(region.id)}
//                 onMouseEnter={() => setHoveredOrgan(region.id)}
//                 onMouseLeave={() => setHoveredOrgan(null)}
//                 className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all duration-200 ${
//                   isSelected
//                     ? "bg-primary text-primary-content border-primary translate-x-2 transform shadow-md"
//                     : isHovered
//                       ? "bg-base-200 border-secondary translate-x-1"
//                       : "border-base-300 hover:border-base-content/30 bg-transparent"
//                 } `}
//               >
//                 <div>
//                   <h4
//                     className={`font-semibold ${isSelected ? "text-primary-content" : "text-base-content"}`}
//                   >
//                     {region.name}
//                   </h4>
//                   <p
//                     className={`text-sm ${isSelected ? "text-primary-content/80" : "text-base-content/60"}`}
//                   >
//                     {region.desc}
//                   </p>
//                 </div>

//                 {/* Radio button indicator */}
//                 <div
//                   className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${isSelected ? "border-primary-content" : "border-base-300"} `}
//                 >
//                   {isSelected && (
//                     <div className="bg-primary-content h-2.5 w-2.5 rounded-full" />
//                   )}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// }
